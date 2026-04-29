# Inventory API

This document describes the inventory backend endpoints under `/api/inventory`.

## Base URL

- Local: `http://localhost:3000/api/inventory`
- Example: `GET /api/inventory/places`

## Timezone and Date Rules

- Daily checklist and dashboard date logic use `America/New_York` (Florida time).
- Date format is `YYYY-MM-DD`.

## Shared Error Contract

The API uses a consistent error shape.

### 400 Invalid payload

```json
{
  "error": "Invalid payload",
  "field": "name",
  "reason": "OPTIONAL_REASON"
}
```

### 404 Not found

```json
{
  "error": "Not found",
  "service": "INVENTORY_PRODUCT",
  "id": "product-id"
}
```

### 409 Conflict

```json
{
  "error": "Conflict",
  "reason": "CHECKLIST_NOT_OPEN"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error"
}
```

## Enums

### `InventoryPlaceType`

- `FRIDGE`
- `FREEZER`
- `SHELF`
- `PANTRY`
- `OTHER`

### `InventoryChecklistStatus`

- `OPEN`
- `SUBMITTED`
- `REVIEWED`

### `InventoryChecklistItemResult`

- `PENDING`
- `OK`
- `BELOW_MIN`
- `REFILL_NEEDED`
- `OUT_OF_STOCK`

### `InventoryAlertType`

- `LOW_STOCK`
- `THRESHOLD`
- `REFILL`

### `InventoryAlertSeverity`

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`

### `InventoryAlertStatus`

- `OPEN`
- `ACKED`
- `RESOLVED`

## Core Response Types

### `InventoryPlace`

```json
{
  "id": "string",
  "createdAt": "ISO_DATETIME",
  "updatedAt": "ISO_DATETIME",
  "name": "string",
  "type": "FRIDGE|FREEZER|SHELF|PANTRY|OTHER",
  "active": true,
  "displayOrder": 1,
  "notes": "string|null"
}
```

### `InventoryProduct`

```json
{
  "id": "string",
  "createdAt": "ISO_DATETIME",
  "updatedAt": "ISO_DATETIME",
  "name": "string",
  "unit": "string",
  "active": true,
  "minQuantity": 10,
  "alertThreshold": 5,
  "requiresRefill": false,
  "notifyBelowThreshold": true,
  "notes": "string|null"
}
```

- `InventoryProduct.minQuantity` is the default minimum used when a new stock row is created without explicit `minQuantity`.

### `InventoryStock`

```json
{
  "id": "string",
  "createdAt": "ISO_DATETIME",
  "updatedAt": "ISO_DATETIME",
  "placeId": "string",
  "productId": "string",
  "placeName": "string",
  "productName": "string",
  "currentQuantity": 12,
  "minQuantity": 5,
  "includeInChecklist": true,
  "lastCheckedAt": "ISO_DATETIME|null",
  "lastCheckedBy": "string|null"
}
```

### `InventoryChecklistWithItems`

```json
{
  "id": "string",
  "createdAt": "ISO_DATETIME",
  "updatedAt": "ISO_DATETIME",
  "checkDate": "YYYY-MM-DD",
  "status": "OPEN|SUBMITTED|REVIEWED",
  "startedBy": "string|null",
  "submittedBy": "string|null",
  "submittedAt": "ISO_DATETIME|null",
  "items": [
    {
      "id": "string",
      "checklistId": "string",
      "placeId": "string",
      "productId": "string",
      "placeName": "string",
      "productName": "string",
      "expectedMinQuantity": 10,
      "countedQuantity": 8,
      "outOfStock": false,
      "result": "PENDING|OK|BELOW_MIN|REFILL_NEEDED|OUT_OF_STOCK",
      "notes": "string|null",
      "checkedAt": "ISO_DATETIME|null",
      "checkedBy": "string|null"
    }
  ]
}
```

### `InventoryAlert`

```json
{
  "id": "string",
  "createdAt": "ISO_DATETIME",
  "updatedAt": "ISO_DATETIME",
  "type": "LOW_STOCK|THRESHOLD|REFILL",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "status": "OPEN|ACKED|RESOLVED",
  "message": "string",
  "placeId": "string",
  "productId": "string",
  "placeName": "string",
  "productName": "string",
  "checklistId": "string|null",
  "checklistItemId": "string|null",
  "triggeredAt": "ISO_DATETIME",
  "ackedAt": "ISO_DATETIME|null",
  "ackedBy": "string|null",
  "resolvedAt": "ISO_DATETIME|null",
  "resolvedBy": "string|null"
}
```

### `InventoryDashboard`

```json
{
  "floridaDate": "YYYY-MM-DD",
  "totalActivePlaces": 3,
  "totalActiveProducts": 40,
  "belowMinimumCount": 7,
  "refillRequiredCount": 4,
  "openAlertCount": 9,
  "todayChecklist": {
    "id": "string",
    "status": "OPEN|SUBMITTED|REVIEWED",
    "itemCount": 50,
    "checkedCount": 25
  }
}
```

## Endpoints

## Places

### `GET /api/inventory/places`

- Response `200`: `InventoryPlace[]`

### `POST /api/inventory/places`

Request body:

```json
{
  "name": "Fridge A",
  "type": "FRIDGE",
  "active": true,
  "displayOrder": 1,
  "notes": "Main kitchen fridge"
}
```

- Required: `name`, `type`
- Optional: `active`, `displayOrder`, `notes`
- Response `201`: `InventoryPlace`

### `PATCH /api/inventory/places/:placeId`

Request body (all fields optional):

```json
{
  "name": "Fridge B",
  "type": "FREEZER",
  "active": false,
  "displayOrder": 2,
  "notes": null
}
```

- Response `200`: `InventoryPlace`

## Products

### `GET /api/inventory/products`

- Response `200`: `InventoryProduct[]`

### `POST /api/inventory/products`

Request body:

```json
{
  "name": "Chicken Breast",
  "unit": "kg",
  "active": true,
  "minQuantity": 10,
  "alertThreshold": 6,
  "requiresRefill": true,
  "notifyBelowThreshold": true,
  "notes": "Keep chilled"
}
```

- Required: `name`, `unit`, `minQuantity`
- Optional: `active`, `alertThreshold`, `requiresRefill`, `notifyBelowThreshold`, `notes`
- Response `201`: `InventoryProduct`

### `PATCH /api/inventory/products/:productId`

Request body (all fields optional):

```json
{
  "name": "Chicken Breast Premium",
  "unit": "kg",
  "active": true,
  "minQuantity": 12,
  "alertThreshold": null,
  "requiresRefill": true,
  "notifyBelowThreshold": false,
  "notes": null
}
```

- Response `200`: `InventoryProduct`

Notes:

- `alertThreshold` accepts `number | null`.
- `minQuantity` must be a non-negative integer when provided.

## Stocks

### `GET /api/inventory/stocks`

Query params:

- `placeId` optional

Examples:

- `/api/inventory/stocks`
- `/api/inventory/stocks?placeId=PLACE_ID`

- Response `200`: `InventoryStock[]`

### `POST /api/inventory/stocks`

Request body:

```json
{
  "placeId": "string",
  "productId": "string",
  "currentQuantity": 8,
  "minQuantity": 5,
  "includeInChecklist": true,
  "actorId": "worker-id",
  "source": "MANUAL"
}
```

- Required: `placeId`, `productId`, `currentQuantity`
- Optional: `minQuantity`, `includeInChecklist`, `actorId`, `source`
- `minQuantity` is the place+product minimum (e.g. cheese fridge `5`, cheese freezer `10`).
- If `minQuantity` is omitted when creating a new stock row, backend uses `InventoryProduct.minQuantity`.
- `source`: `MANUAL | CHECKLIST | SYSTEM` (defaults to `MANUAL`)
- Response `200`: `InventoryStock`

### `DELETE /api/inventory/stocks`

Deletes one stock row identified by `placeId + productId`.

Request body:

```json
{
  "placeId": "string",
  "productId": "string",
  "actorId": "worker-id",
  "source": "MANUAL"
}
```

- Required: `placeId`, `productId`
- Optional: `actorId`, `source`
- `source`: `MANUAL | SYSTEM` (defaults to `MANUAL`)
- Response `200`: deleted `InventoryStock`

### `PATCH /api/inventory/stocks/prompt`

Sets whether this place+product stock row should appear in daily checklist prompts.

Request body:

```json
{
  "placeId": "fridge-id",
  "productId": "cheese-id",
  "includeInChecklist": true,
  "actorId": "worker-id"
}
```

- Required: `placeId`, `productId`, `includeInChecklist`
- Optional: `actorId`
- Response `200`: `InventoryStock`

### `POST /api/inventory/stocks/transfer`

Moves quantity of one product from one place to another atomically.

Request body:

```json
{
  "fromPlaceId": "freezer-place-id",
  "toPlaceId": "fridge-place-id",
  "productId": "cheese-product-id",
  "quantity": 1,
  "actorId": "worker-id",
  "source": "CHECKLIST",
  "checklistId": "optional-checklist-id",
  "checklistItemId": "optional-checklist-item-id",
  "notes": "Moved 1 cheese from freezer to fridge"
}
```

- Required: `fromPlaceId`, `toPlaceId`, `productId`, `quantity`
- Optional: `actorId`, `source`, `checklistId`, `checklistItemId`, `notes`
- `quantity` must be a positive integer (`> 0`)
- `fromPlaceId` and `toPlaceId` must be different
- If source stock is insufficient, returns `409` with `reason: "INSUFFICIENT_SOURCE_STOCK"`

Response `200`:

```json
{
  "fromStock": {
    "id": "string",
    "createdAt": "ISO_DATETIME",
    "updatedAt": "ISO_DATETIME",
    "placeId": "string",
    "productId": "string",
    "placeName": "string",
    "productName": "string",
    "currentQuantity": 9,
    "minQuantity": 10,
    "includeInChecklist": true,
    "lastCheckedAt": "ISO_DATETIME|null",
    "lastCheckedBy": "string|null"
  },
  "toStock": {
    "id": "string",
    "createdAt": "ISO_DATETIME",
    "updatedAt": "ISO_DATETIME",
    "placeId": "string",
    "productId": "string",
    "placeName": "string",
    "productName": "string",
    "currentQuantity": 5,
    "minQuantity": 5,
    "includeInChecklist": true,
    "lastCheckedAt": "ISO_DATETIME|null",
    "lastCheckedBy": "string|null"
  }
}
```

## Checklists

### `POST /api/inventory/checklists/daily/open`

Creates today checklist (or returns existing one) using Florida date.
Only stock rows with `includeInChecklist = true` are included in generated checklist items.
Checklist item `expectedMinQuantity` is taken from `InventoryStock.minQuantity`.

Request body:

```json
{
  "workerId": "worker-id",
  "date": "2026-04-28"
}
```

- Optional: `workerId`, `date`
- Response `201`: `InventoryChecklistWithItems`

### `GET /api/inventory/checklists/today`

Query params:

- `date` optional (`YYYY-MM-DD`)

Examples:

- `/api/inventory/checklists/today`
- `/api/inventory/checklists/today?date=2026-04-28`

- Response `200`: `InventoryChecklistWithItems | null`

### `PATCH /api/inventory/checklists/:checklistId/items/:itemId`

Request body:

```json
{
  "countedQuantity": 7,
  "notes": "Need refill after lunch",
  "result": "REFILL_NEEDED",
  "workerId": "worker-id"
}
```

- Required: `countedQuantity`
- Optional: `notes`, `result`, `workerId`
- `result` allowed values:
  - `PENDING`
  - `OK`
  - `BELOW_MIN`
  - `REFILL_NEEDED`
  - `OUT_OF_STOCK`
- If `result` is omitted, backend computes it.
- `outOfStock` is computed by backend based on whether other places still have enough transferable stock above their own minimums to cover the missing quantity.
- Response `200`: updated `InventoryChecklistWithItems`

### `POST /api/inventory/checklists/:checklistId/submit`

Request body:

```json
{
  "workerId": "worker-id"
}
```

- Optional: `workerId`
- Response `200`: updated `InventoryChecklistWithItems`
- Can return `409` conflict if checklist is not open.

## Alerts

### `GET /api/inventory/alerts`

Query params:

- `status` optional (`OPEN | ACKED | RESOLVED`)
- `placeId` optional
- `productId` optional

Examples:

- `/api/inventory/alerts`
- `/api/inventory/alerts?status=OPEN`
- `/api/inventory/alerts?status=OPEN&placeId=...`

- Response `200`: `InventoryAlert[]`

### `PATCH /api/inventory/alerts/:alertId/ack`

Request body:

```json
{
  "workerId": "worker-id"
}
```

- Optional: `workerId`
- Response `200`: `InventoryAlert`

### `PATCH /api/inventory/alerts/:alertId/resolve`

Request body:

```json
{
  "workerId": "worker-id"
}
```

- Optional: `workerId`
- Response `200`: `InventoryAlert`

## Dashboard

### `GET /api/inventory/dashboard`

Query params:

- `date` optional (`YYYY-MM-DD`)

Examples:

- `/api/inventory/dashboard`
- `/api/inventory/dashboard?date=2026-04-28`

- Response `200`: `InventoryDashboard`

## Frontend Integration Notes

- Use `checkDate` and `floridaDate` as the canonical day keys for daily operations.
- Always handle `null` responses for `GET /checklists/today`.
- For checklist submit, expect business-rule responses (`400`/`409`) and show actionable UI errors.
- For quantity fields, send integers only.
