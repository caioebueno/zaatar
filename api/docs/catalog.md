# Catalog API

Base URL (local): `http://localhost:4000`

All routes require manager auth (`Authorization: Bearer <manager-access-token>`).

Most catalog routes proxy to the legacy web API. The `x-business-id` header (or cookie/query equivalent) is forwarded to the web API.

---

## Products

### List Products

`GET /products`

Returns all products for the active business.

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
  // ...category/modifier/photo/combo fields
};
```

### Update Product

`PATCH /products/:productId`

Request body (partial update):

```ts
type UpdateProductBody = {
  name?: string;
  visible?: boolean;
  alertDriver?: boolean;
  description?: string | null;
  price?: number | null;
  comparedAtPrice?: number | null;
  itemType?: "PRODUCT" | "COMBO";
  // ...category/modifier/photo/combo fields
};
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

### Update Modifier Group

`PATCH /modifier-groups/:modifierGroupId`

### Delete Modifier Group

`DELETE /modifier-groups/:modifierGroupId`

---

## Modifier Group Items

### Create Modifier Group Item

`POST /modifier-group-items`

### Update Modifier Group Item

`PATCH /modifier-group-items/:modifierGroupItemId`

### Delete Modifier Group Item

`DELETE /modifier-group-items/:modifierGroupItemId`

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
