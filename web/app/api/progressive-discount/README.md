# Progressive Discount Prizes API

## Endpoints

`GET /api/progressive-discount/prizes?progressiveDiscountStepId=:stepId`

Returns all prizes attached to the provided progressive discount step.
If `progressiveDiscountStepId` is omitted, returns all prizes.

`POST /api/progressive-discount/prizes`

Creates a prize and attaches it to a progressive discount step.

Body fields:

- `name` (required string)
- `quantity` (optional integer, default `1`)
- `imageUrl` (optional string or `null`)
- `progressiveDiscountStepId` (required string)
- `productIds` (optional string array, defaults to `[]`)

`PATCH /api/progressive-discount/prizes/:prizeId`

Updates an existing prize and can re-attach it to another progressive discount step.

Body fields (all optional):

- `name` (string)
- `quantity` (integer >= 1)
- `imageUrl` (string or `null`)
- `progressiveDiscountStepId` (string)
- `productIds` (string array; replaces current products, use `[]` to clear)

## Prize Response

```json
{
  "id": "prize-id",
  "createdAt": "2026-04-08T19:10:00.000Z",
  "name": "3 Sweet Sfihas",
  "quantity": 3,
  "imageUrl": "https://cdn.example.com/prizes/sweet-sfihas.png",
  "progressiveDiscountStepId": "progressive-discount-step-id",
  "products": [
    {
      "id": "product-id",
      "name": "Nutella Sfiha",
      "price": 0,
      "comparedAtPrice": 899,
      "photos": [
        {
          "id": "file-id",
          "url": "https://cdn.example.com/products/nutella.png"
        }
      ]
    }
  ]
}
```

## Error Responses

```json
{
  "error": "Invalid payload",
  "field": "name"
}
```

```json
{
  "error": "Progressive discount step not found"
}
```

```json
{
  "error": "Product not found"
}
```

```json
{
  "error": "Prize not found"
}
```
