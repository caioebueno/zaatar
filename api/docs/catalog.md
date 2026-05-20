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

### Update Product

`PATCH /products/:productId`

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

---

## Customers

### Search Customers

`GET /customers/search`

Query params:

- `q`: search query string

### Create Customer

`POST /customers`

---

## Address Search

`GET /address-search`

Query params:

- `q`: search query string

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
