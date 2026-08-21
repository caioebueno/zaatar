# Catalog API

Base URL (local): `http://localhost:4000`

All routes require manager auth (`Authorization: Bearer <manager-access-token>`).

Most catalog routes proxy to the legacy web API. The `x-business-id` header (or cookie/query equivalent) is forwarded to the web API.

---

## Products

### List Products

`GET /products`

Returns all products for the active business.

Product preparation steps include both ids and goal timing:

```ts
type ProductPreparationStep = {
  id: string;
  goalMinutes: number;
};

type ProductListItem = {
  preparationStepIds: string[];
  preparationSteps: ProductPreparationStep[];
};
```

### Create Product

`POST /products`

Request body (main fields):

```ts
type CreateProductBody = {
  id?: string;
  name: string;
  visible?: boolean;
  alertDriver?: boolean; // defaults to false
  description?: string | null;
  price?: number | null;
  comparedAtPrice?: number | null;
  itemType?: "PRODUCT" | "COMBO";
  preparationStepIds?: string[];
  // ...category/modifier/photo/combo fields
};
```

### Update Product

`PATCH /products/:productId`

Partially updates an existing product. You can send only the fields you want to change.

### Path Params

| Param | Required | Description |
|---|---|---|
| `productId` | Yes | Product id |

### Request Body

```ts
type UpdateProductBody = {
  name?: string;
  visible?: boolean;
  alertDriver?: boolean;
  description?: string | null;
  price?: number | null; // integer >= 0
  comparedAtPrice?: number | null; // integer >= 0
  itemType?: "PRODUCT" | "COMBO";

  // Category linking
  categoryId?: string | null; // primary category relation
  categoryIds?: string[]; // ProductCategory links
  categoryIndex?: number | null; // integer >= 0

  // Rich content
  translations?: Record<string, unknown> | null;

  // Photos — use one style only
  photoIds?: string[];
  photoUrls?: string[];

  // Product relations
  modifierGroupIds?: string[];
  preparationStepIds?: string[];

  // Combo definitions
  comboSlots?: Array<{
    name: string;
    translations?: Record<string, unknown> | null;
    minSelect: number; // integer >= 0
    maxSelect: number; // integer >= minSelect
    allowDuplicates?: boolean; // defaults to true
    sortIndex?: number | null; // integer >= 0
    options: Array<{
      productId: string;
      extraPrice?: number; // integer >= 0, defaults to 0
      sortIndex?: number | null; // integer >= 0
    }>;
  }>;

  // Legacy combo formats
  comboItems?: Array<{
    productId: string;
    quantity: number; // integer > 0
  }>;
  products?: Array<{
    productId: string;
    quantity: number; // integer > 0
  }>;
};
```

### Field Behavior

- `name` must be a non-empty string when provided.
- `description` accepts `null` to clear the description.
- `price` and `comparedAtPrice` accept `null` to clear them.
- `translations` accepts `null` to clear translations.
- `categoryId` updates the direct `Product.categoryId` relation. Send `null` to disconnect it.
- `categoryIds` updates `ProductCategory` links for multi-category support.
- `categoryIndex` updates the category ordering value. When `categoryIds` is sent, the same `categoryIndex` is applied to each linked category row.
- Updating one product's `categoryIndex` automatically reindexes the other products in that category to a consecutive sequence starting at `1`.
- For reorder flows, send one `PATCH /products/:productId` request for the moved product. You do not need to update every product in the section.
- If the product is linked to multiple categories, include `categoryId` in the request body to indicate which category's product order should be updated.
- `photoIds` replaces the whole photo list with existing uploaded file ids.
- `photoUrls` replaces the whole photo list using public URLs. Missing file records are created automatically.
- `photoIds` and `photoUrls` cannot be sent together.
- To add an image, send the existing image list plus the new image in the same request.
- To remove an image, send the updated image list without that image.
- To remove all images, send `photoIds: []` or `photoUrls: []`.
- `modifierGroupIds` replaces the whole modifier group list.
- `preparationStepIds` replaces the whole preparation step list.
- `visible` and `alertDriver` are persisted separately from the standard Prisma update path, but they behave like normal boolean updates.

### Product Image Management

Product images are managed through `PATCH /products/:productId`.

You have 2 supported approaches:

- `photoIds`: use file ids from `POST /bucket/upload`
- `photoUrls`: use public image URLs directly

Important behavior:

- Both fields replace the **entire** product image list.
- The API does **not** append a single image automatically.
- Send only one style per request: `photoIds` or `photoUrls`.

Typical flows:

1. Upload image with `POST /bucket/upload`
2. Read the current product image ids
3. Send `PATCH /products/:productId` with the full next `photoIds` array

Examples:

Add one image while keeping existing images:

```json
{
  "photoIds": ["file_existing_1", "file_existing_2", "file_new_3"]
}
```

Remove one image:

```json
{
  "photoIds": ["file_existing_1"]
}
```

Remove all images:

```json
{
  "photoIds": []
}
```

### Combo Rules

- `comboSlots`, `comboItems`, and `products` are only valid when the resulting product `itemType` is `COMBO`.
- If `itemType` is `PRODUCT`, any combo structure is rejected.
- A combo cannot include itself as an option or product.
- All referenced combo product ids must already exist.
- Sending `comboSlots` replaces all existing combo slots and options.
- Sending `products` replaces the direct combo-product list stored in the legacy combo-product table.
- Sending `comboItems` is supported as a legacy input and is converted into simple one-option combo slots.
- For `comboSlots`:
  - `options` must be a non-empty array
  - duplicate option `productId`s are deduplicated
  - if `allowDuplicates` is `false`, `maxSelect` cannot be greater than the number of unique options

### Example Request

```http
PATCH /products/prod_margherita
Authorization: Bearer <manager-access-token>
Content-Type: application/json
```

```ts
{
  "name": "Large Margherita",
  "visible": true,
  "alertDriver": false,
  "description": "Classic tomato, mozzarella, and basil",
  "price": 2499,
  "comparedAtPrice": 2799,
  "categoryId": "pizza-category",
  "categoryIds": ["pizza-category", "featured-category"],
  "categoryIndex": 2,
  "photoUrls": [
    "https://cdn.example.com/products/margherita-1.png",
    "https://cdn.example.com/products/margherita-2.png"
  ],
  "modifierGroupIds": ["size-group", "extra-cheese-group"],
  "preparationStepIds": ["prep-dough", "prep-bake"]
}
```

### Success Response (`200`)

Returns the fully refreshed product object after update.

```ts
type UpdateProductResponse = {
  id: string;
  createdAt: string;
  itemType: "PRODUCT" | "COMBO";
  name: string;
  visible: boolean;
  alertDriver: boolean;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  categoryIds: string[];
  categoryEntries: Array<{
    categoryId: string;
    categoryIndex: number | null;
  }>;
  translations: unknown | null;
  photos: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  photoIds: string[];
  modifierGroupIds: string[];
  modifierGroups: Array<{
    id: string;
    title: string;
    translations: unknown | null;
    required: boolean;
    type: "MULTI" | "SINGLE" | null;
    minSelection: number | null;
    maxSelection: number | null;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      translations: unknown | null;
      photo: {
        id: string;
        url: string;
      } | null;
    }>;
  }>;
  preparationStepIds: string[];
  preparationSteps: Array<{
    id: string;
    goalMinutes: number;
  }>;
  comboSlots: Array<{
    id: string;
    name: string;
    translations: unknown | null;
    minSelect: number;
    maxSelect: number;
    allowDuplicates: boolean;
    sortIndex: number | null;
    options: Array<{
      productId: string;
      productName: string;
      extraPrice: number;
      sortIndex: number | null;
    }>;
  }>;
  comboItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
};
```

### Error Responses

`400 Invalid payload`

```json
{ "error": "Invalid payload", "field": "name" }
{ "error": "Invalid payload", "field": "price" }
{ "error": "Invalid payload", "field": "photoUrls" }
{ "error": "Invalid payload", "field": "modifierGroupIds" }
{ "error": "Invalid payload", "field": "preparationStepIds" }
{ "error": "Invalid payload", "field": "comboSlots" }
{ "error": "Invalid payload", "field": "products" }
{ "error": "Invalid payload", "field": "body" }
```

Common `400` cases:

- `productId` is empty
- no updatable field was sent
- `photoIds` and `photoUrls` were both sent
- referenced category / file / modifier group / preparation step / combo product does not exist
- `comboSlots` contains invalid quantities or empty options
- combo payload is sent for a non-`COMBO` product
- product tries to include itself in its combo definition

`404 Product not found`

```json
{ "error": "Product not found" }
```

---

## Menus

### List Menus

`GET /menus`

### Create Menu

`POST /menus`

### Update Menu

`PATCH /menus/:menuId`

---

## Categories

### List Categories

`GET /categories`

### Create Category

`POST /categories`

### Update Category

`PATCH /categories/:categoryId`

### Delete Category

`DELETE /categories/:categoryId`

Detailed schemas: see [categories.md](./categories.md).

---

## Modifier Groups

### Create Modifier Group

`POST /modifier-groups`

Creates a new modifier group.

### Request Body

```ts
type CreateModifierGroupBody = {
  id?: string;
  title: string;
  required?: boolean; // defaults to false
  type?: "MULTI" | "SINGLE" | null;
  minSelection?: number | null; // integer >= 0
  maxSelection?: number | null; // integer >= 0
  translations?: Record<string, unknown> | null;
};
```

### Field Rules

- `title` must be a non-empty string.
- `required` defaults to `false`.
- `type` can be `"MULTI"`, `"SINGLE"`, or `null`.
- `minSelection` and `maxSelection` must be integers `>= 0` when provided.
- if both `minSelection` and `maxSelection` are provided, `minSelection <= maxSelection`.
- `translations` must be an object or `null` when provided.

### Example Request

```http
POST /modifier-groups
Authorization: Bearer <manager-access-token>
Content-Type: application/json
```

```json
{
  "title": "Choose Your Size",
  "required": true,
  "type": "SINGLE",
  "minSelection": 1,
  "maxSelection": 1,
  "translations": {
    "pt": {
      "title": "Escolha o tamanho"
    }
  }
}
```

### Success Response (`200`)

```ts
type CreateModifierGroupResponse = {
  id: string;
  title: string;
  required: boolean;
  type: "MULTI" | "SINGLE" | null;
  minSelection: number | null;
  maxSelection: number | null;
  translations: unknown | null;
  items: [];
};
```

### Error Responses

`400 Invalid payload`

```json
{ "error": "Invalid payload", "field": "title" }
{ "error": "Invalid payload", "field": "required" }
{ "error": "Invalid payload", "field": "type" }
{ "error": "Invalid payload", "field": "minSelection" }
{ "error": "Invalid payload", "field": "translations" }
```

`409 Modifier group already exists`

```json
{ "error": "Modifier group already exists", "field": "id" }
```

### Update Modifier Group

`PATCH /modifier-groups/:modifierGroupId`

Partially updates an existing modifier group.

### Path Params

| Param | Required | Description |
|---|---|---|
| `modifierGroupId` | Yes | Modifier group id |

### Request Body

```ts
type UpdateModifierGroupBody = {
  title?: string;
  required?: boolean;
  type?: "MULTI" | "SINGLE" | null;
  minSelection?: number | null; // integer >= 0
  maxSelection?: number | null; // integer >= 0
  translations?: Record<string, unknown> | null;
};
```

### Field Rules

- Send only the fields you want to change.
- `title` must be a non-empty string when provided.
- `type` accepts `"MULTI"`, `"SINGLE"`, or `null`.
- `minSelection` and `maxSelection` accept `null` to clear the value.
- if the resulting `minSelection` and `maxSelection` are both non-null, `minSelection <= maxSelection`.
- `translations` accepts `null` to clear translations.
- If no valid updatable field is sent, the API returns `field: "body"`.

### Example Request

```http
PATCH /modifier-groups/size-group
Authorization: Bearer <manager-access-token>
Content-Type: application/json
```

```json
{
  "title": "Pizza Size",
  "required": true,
  "type": "SINGLE",
  "minSelection": 1,
  "maxSelection": 1
}
```

### Success Response (`200`)

```ts
type UpdateModifierGroupResponse = {
  id: string;
  title: string;
  required: boolean;
  type: "MULTI" | "SINGLE" | null;
  minSelection: number | null;
  maxSelection: number | null;
  translations: unknown | null;
};
```

### Error Responses

`400 Invalid payload`

```json
{ "error": "Invalid payload", "field": "modifierGroupId" }
{ "error": "Invalid payload", "field": "title" }
{ "error": "Invalid payload", "field": "required" }
{ "error": "Invalid payload", "field": "type" }
{ "error": "Invalid payload", "field": "minSelection" }
{ "error": "Invalid payload", "field": "translations" }
{ "error": "Invalid payload", "field": "body" }
```

`404 Modifier group not found`

```json
{ "error": "Modifier group not found" }
```

### Delete Modifier Group

`DELETE /modifier-groups/:modifierGroupId`

Deletes a modifier group.

### Path Params

| Param | Required | Description |
|---|---|---|
| `modifierGroupId` | Yes | Modifier group id |

### Success Response (`200`)

```json
{
  "id": "size-group",
  "deleted": true
}
```

### Error Responses

`400 Invalid payload`

```json
{ "error": "Invalid payload", "field": "modifierGroupId" }
```

`404 Modifier group not found`

```json
{ "error": "Modifier group not found" }
```

---

## Modifier Group Items

### Create Modifier Group Item

`POST /modifier-group-items`

Creates a new item inside a modifier group.

### Request Body

```ts
type CreateModifierGroupItemBody = {
  id?: string;
  modifierGroupId: string;
  name: string;
  description?: string | null;
  price: number; // integer >= 0
  translations?: Record<string, unknown> | null;
  fileId?: string | null;
};
```

### Field Rules

- `modifierGroupId` must reference an existing modifier group.
- `name` must be a non-empty string.
- `description` accepts `null`.
- `price` must be a non-negative integer.
- `translations` must be an object or `null` when provided.
- `fileId` must reference an existing uploaded file when provided.

### Update Modifier Group Item

`PATCH /modifier-group-items/:modifierGroupItemId`

Partially updates a modifier group item.

### Path Params

| Param | Required | Description |
|---|---|---|
| `modifierGroupItemId` | Yes | Modifier group item id |

Note:

- The implementation route uses `itemId` internally, but the public API path is `:modifierGroupItemId`.

### Request Body

```ts
type UpdateModifierGroupItemBody = {
  name?: string;
  description?: string | null;
  price?: number; // integer >= 0
  translations?: Record<string, unknown> | null;
  modifierGroupId?: string | null;
  fileId?: string | null;
  photoUrl?: string | null;
};
```

### Field Rules

- `modifierGroupId` can be set to `null` to disconnect the item from its group.
- `fileId` can be set to `null` to remove the linked photo.
- `photoUrl` can be set to `null` to remove the linked photo.
- `fileId` and `photoUrl` cannot be sent together.
- when `photoUrl` is provided, it must be a valid `http` or `https` URL; a backing file record is created automatically if needed.
- `translations` accepts `null` to clear translations.
- If no valid updatable field is sent, the API returns `field: "body"`.

### Delete Modifier Group Item

`DELETE /modifier-group-items/:modifierGroupItemId`

Removes a modifier group item from its current modifier group without deleting the underlying item record.

Important behavior:

- The API disconnects the item's `modifierGroupId` instead of deleting the row from the database.
- Historical order selections and preparation tracking that reference this modifier item are preserved.
- The modifier item can later be attached to another modifier group with `PATCH /modifier-group-items/:modifierGroupItemId`.

Success response example:

```json
{
  "id": "35e966d6-7e77-4f83-9670-b4bea90dc110",
  "modifierGroupId": null,
  "name": "Extra cheese",
  "description": null,
  "price": 200,
  "translations": null,
  "photo": null,
  "deleted": true,
  "disconnected": true
}
```

Error response example:

```json
{
  "error": "Modifier group item not found"
}
```

Field behavior after delete:

- `deleted: true` means the remove action succeeded from the API caller perspective.
- `disconnected: true` means the item was detached from the group, not physically removed from the database.
- `modifierGroupId: null` confirms the item is no longer attached to a modifier group.

If you need to hard-delete unused rows in the future, that should be implemented as a separate archival or cleanup flow, not this endpoint.

---

## POS

### Exclusive Promotions

`GET /pos/exclusive-promotions`

### Progressive Discount

`GET /progressive-discount`

Detailed schema and examples: see [progressive-discount.md](./progressive-discount.md).

---

## Customers
Customer routes:

- `GET /customers/search`
- `POST /customers`
- `POST /customers/:customerId/addresses`
- `PATCH /delivery-addresses/:addressId`

Detailed schemas and examples: see [customers.md](./customers.md).

---

## Address Search

`GET /address-search`

Query params:

- `q`: search query string

Detailed schemas: see [address-search.md](./address-search.md).

---

## Media Upload

`POST /bucket/upload`

Content-Type: `multipart/form-data`

Upload a file (e.g. product photo or logo). Returns an upload result with the stored URL.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WEB_API_BASE_URL` | No | Base URL for legacy web API (default `http://localhost:3000`) |
