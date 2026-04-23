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

Clear delivered timestamp:

```json
{
  "deliveredAt": null
}
```

## Response

Success (`200`): returns the updated `TOrder` payload.

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
