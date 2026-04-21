# Progressive Discount Prizes API

## Endpoints

`GET /api/progressive-discount`

Returns the active progressive discount (`completed = false`) with steps and prizes.
If there is no non-completed discount, it falls back to the most recently created discount.
Returns `null` when there are no progressive discounts.

`GET /api/progressive-discount/prizes?progressiveDiscountStepId=:stepId`

Returns all prizes attached to the provided progressive discount step.
If `progressiveDiscountStepId` is omitted, returns all prizes.

`POST /api/progressive-discount/prizes`

Creates a prize and attaches it to a progressive discount step.

Body fields:

- `name` (required string)
- `translations` (optional JSON object or `null`)
- `quantity` (optional integer, default `1`)
- `imageUrl` (optional string or `null`)
- `progressiveDiscountStepId` (required string)
- `productIds` (optional string array, defaults to `[]`)

`PATCH /api/progressive-discount/prizes/:prizeId`

Updates an existing prize and can re-attach it to another progressive discount step.

Body fields (all optional):

- `name` (string)
- `translations` (JSON object or `null`)
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
  "translations": {
    "es": {
      "title": "3 sfihas dulces"
    }
  },
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

## Active Progressive Discount Response

```json
{
  "id": "progressive-discount-id",
  "steps": [
    {
      "id": "step-id",
      "type": "PERCENTAGEDISCOUNT",
      "amount": 3000,
      "discount": 10,
      "prizes": []
    },
    {
      "id": "gift-step-id",
      "type": "GIFT",
      "amount": 5000,
      "discount": null,
      "prizes": [
        {
          "id": "prize-id",
          "name": "3 Sweet Sfihas",
          "translations": {
            "es": {
              "title": "3 sfihas dulces"
            }
          },
          "quantity": 3,
          "imageUrl": "https://cdn.example.com/prizes/sweet-sfihas.png",
          "progressiveDiscountStepId": "gift-step-id",
          "products": [
            {
              "id": "product-id",
              "name": "Nutella Sfiha",
              "price": 799,
              "comparedAtPrice": null,
              "photos": []
            }
          ]
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
