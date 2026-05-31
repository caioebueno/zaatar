# Categories API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## GET /categories

List categories with products and nested catalog data.

Query params:

- `menuId` (optional): target menu id.
- `promotionId` (optional): exclusive promotion id used to filter exclusive products.

Behavior notes:

- If `menuId` is omitted, API uses the default active menu.
- If `menuId` is provided but has no attached categories, API falls back to default menu categories.
- Exclusive promotion products are only returned when `promotionId` is valid/active/not expired/weekday-allowed.

Success (`200`) schema:

```ts
type TranslationMap = Record<string, Record<string, string>>;

type CategoriesResponse = Array<{
  id: string;
  title: string;
  menuIndex: number | null;
  translations?: TranslationMap;
  products: Array<{
    visible: boolean;
    alertDriver: boolean;
    id: string;
    itemType: "PRODUCT" | "COMBO";
    name: string;
    translations?: TranslationMap;
    description?: string;
    price?: number;
    categoryIndex?: number;
    comparedAtPrice?: number;
    modifierGroups: Array<{
      id: string;
      title: string;
      required: boolean;
      type: "MULTI" | "SINGLE" | null;
      minSelection: number | null;
      maxSelection: number | null;
      translations?: TranslationMap;
      items: Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        photo?: { id: string; url: string };
        translations?: TranslationMap;
      }>;
    }>;
    photos?: Array<{
      id: string;
      url: string;
    }>;
    comboSlots: Array<{
      id: string;
      name: string;
      translations?: TranslationMap;
      minSelect: number;
      maxSelect: number;
      allowDuplicates: boolean;
      sortIndex: number | null;
      options: Array<{
        id: string;
        productId: string;
        productName: string;
        productTranslations?: TranslationMap;
        productPhotoUrl?: string;
        extraPrice: number;
        sortIndex: number | null;
      }>;
    }>;
    products: Array<{
      productId: string;
      quantity: number;
      productName: string;
      productTranslations?: TranslationMap;
    }>;
  }>;
}>;
```

Error (`500`):

```json
{ "error": "Internal Server Error" }
```

---

## POST /categories

Create a category and attach it to a menu.

Request body schema:

```ts
type CreateCategoryBody = {
  id?: string;
  name: string;
  menuId: string;
  menuIndex?: number | null; // integer >= 0
};
```

Success (`201`):

```json
{
  "id": "category-id",
  "name": "Starters",
  "menuId": "menu-id",
  "menuIndex": 1
}
```

Validation errors (`400`):

```json
{ "error": "Invalid payload", "field": "name" }
```

```json
{ "error": "Invalid payload", "field": "menuId" }
```

Conflict (`409`):

```json
{ "error": "Category already exists", "field": "id" }
```

Server error (`500`):

```json
{ "error": "Internal Server Error" }
```

---

## PATCH /categories/:categoryId

Attach/reindex a category inside a menu.

Path params:

- `categoryId` (required)

Request body schema:

```ts
type UpdateCategoryBody = {
  menuId?: string; // defaults to default menu when omitted
  menuIndex?: number | null; // integer >= 0, null clears explicit index
};
```

Validation rules:

- At least one of `menuId` or `menuIndex` must be provided.

Success (`200`):

```json
{
  "id": "category-id",
  "menuId": "menu-id",
  "menuIndex": 3
}
```

Errors:

- `400` invalid payload
- `404` category not found
- `500` internal server error

---

## DELETE /categories/:categoryId

Detach category from one menu (does not hard-delete the category record itself).

Path params:

- `categoryId` (required)

Query params:

- `menuId` (optional, defaults to default menu id)

Success (`200`):

```json
{
  "id": "category-id",
  "menuId": "menu-id",
  "detached": true
}
```

Errors:

- `400` invalid payload
- `404` category not found
- `500` internal server error
