# Orders API

## Endpoint

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
