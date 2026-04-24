# Orders API

## Endpoints

`POST /api/orders`

Creates a new order.

Request body:

- `cart` (required)
- `customerId` (optional string; if omitted, order is created without a linked customer)
- `orderType` (required `"DELIVERY" | "TAKEAWAY"`)
- `paymentMethod` (required `"CARD" | "CASH" | "ZELLE"`)
- `language` (optional string)
- `scheduleFor` (optional ISO string)
- `addressId` (required for `DELIVERY`, optional for `TAKEAWAY`)
- `tipAmount` (optional number)
- `selectedPrize` (optional object)
- `cupom` (optional string)

`selectedPrize` shape:

```json
{
  "prizeId": "prize-id",
  "selectedProductIds": ["product-1", "product-2"]
}
```

POST request example:

```json
{
  "cart": {
    "items": [
      {
        "cartId": "cart-item-1",
        "productId": "product-id",
        "quantity": 1,
        "modifiers": [],
        "description": "No onions"
      }
    ]
  },
  "customerId": "customer-id",
  "orderType": "DELIVERY",
  "paymentMethod": "CARD",
  "language": "en",
  "addressId": "delivery-address-id",
  "tipAmount": 10,
  "scheduleFor": "2026-04-13T18:00:00.000Z"
}
```

POST success (`201`): returns created `TOrder` payload.

POST validation error (`400`):

```json
{
  "error": "Invalid payload",
  "field": "addressId",
  "reason": "DELIVERY_MUST_HAVE_ADDRESS"
}
```

POST server error (`500`):

```json
{
  "error": "Internal Server Error"
}
```

`PATCH /api/orders/:orderId`

Updates one or more order fields:

- `paidAt` (optional `ISO string` or `null`)
- `paymentMethod` (optional `"CARD" | "CASH" | "ZELLE"`)
- `deliveredAt` (optional `ISO string` or `null`)
- `orderType` (optional `"DELIVERY" | "TAKEAWAY"`)
- `customerId` (optional string or `null`)
- `addressId` (optional string or `null`; required when resulting `orderType` is `DELIVERY`)
- `orderProducts` (optional array) can update existing items and create new items:
  - update existing item: send `id` + any fields to change
  - remove existing item: send `id` + `remove: true`
  - create new item: send `productId` (+ optional fields)
  - each item must include either `id` or `productId` (not both)
  - `remove` (optional boolean, only for existing item by `id`)
  - `quantity` (optional positive integer; defaults to `1` for new items)
  - `comments` (optional string or `null`)
  - `selectedModifierGroupItemIds` (optional string array; replaces modifier selections for updates, attaches modifiers for new items)

Notes:

- at least one field must be sent
- invalid dates or payment methods return `400`
- unknown `orderId` returns `404`

## Request examples

Mark order as paid:

```json
{
  "paidAt": "2026-04-07T14:30:00.000Z"
}
```

Update payment method and delivered timestamp:

```json
{
  "paymentMethod": "CASH",
  "deliveredAt": "2026-04-07T15:10:00.000Z"
}
```

Update delivery type and customer:

```json
{
  "orderType": "TAKEAWAY",
  "customerId": null
}
```

Switch to delivery with address:

```json
{
  "orderType": "DELIVERY",
  "addressId": "delivery-address-id",
  "customerId": "customer-id"
}
```

Update order product items:

```json
{
  "orderProducts": [
    {
      "id": "order-product-1",
      "quantity": 2,
      "comments": "Extra crispy",
      "selectedModifierGroupItemIds": ["modifier-item-1", "modifier-item-2"]
    },
    {
      "id": "order-product-2",
      "remove": true
    },
    {
      "productId": "product-2",
      "quantity": 1,
      "comments": "No onions",
      "selectedModifierGroupItemIds": ["modifier-item-3"]
    }
  ]
}
```

Clear delivered timestamp:

```json
{
  "deliveredAt": null
}
```

## Response

Success (`200`): returns the updated `TOrder` payload.

Order payload notes:

- `tip` is included as the tip percentage selected for the order
- `tipAmount` remains included for backward compatibility

Error (`400`):

```json
{
  "error": "Invalid payload",
  "field": "paymentMethod"
}
```

Error (`404`):

```json
{
  "error": "Order not found"
}
```
