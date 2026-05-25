# Progressive Discount API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## Get Progressive Discount

`GET /progressive-discount`

Returns the current progressive discount configuration used by ordering flows.

Selection behavior:

1. API first tries to return the most recent discount where `completed = false`.
2. If none is open, API falls back to the most recent discount record.
3. If no discount exists, API returns `null`.

### Success (`200`) schema

```ts
type ProgressiveDiscountResponse = {
  id: string;
  steps: Array<{
    id: string;
    type: string; // step.discountType
    amount?: number; // threshold amount (if configured)
    discount?: number; // discount value (if configured)
    prizes: Array<{
      id: string;
      createdAt: string; // ISO datetime
      name: string;
      translations?: Record<string, unknown>;
      quantity: number;
      imageUrl: string | null;
      progressiveDiscountStepId: string;
      products: Array<{
        id: string;
        name: string;
        translations?: Record<string, unknown>;
        price: number | null;
        comparedAtPrice: number | null;
        photos: Array<{
          id: string;
          url: string;
        }>;
      }>;
    }>;
  }>;
} | null;
```

### Example response (`200`)

```json
{
  "id": "pd-01",
  "steps": [
    {
      "id": "step-01",
      "type": "PERCENT",
      "amount": 3000,
      "discount": 10,
      "prizes": [
        {
          "id": "prize-01",
          "createdAt": "2026-05-25T12:30:00.000Z",
          "name": "Free Drink",
          "translations": {
            "pt": { "name": "Bebida grátis" },
            "es": { "name": "Bebida gratis" }
          },
          "quantity": 1,
          "imageUrl": null,
          "progressiveDiscountStepId": "step-01",
          "products": [
            {
              "id": "product-01",
              "name": "Coke Can",
              "price": 299,
              "comparedAtPrice": null,
              "photos": [
                {
                  "id": "file-01",
                  "url": "https://example.com/coke.png"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### No config response (`200`)

```json
null
```

### Error (`500`)

```json
{ "error": "Internal Server Error" }
```

### Notes

- Steps are ordered by `amount` ascending.
- Prizes are ordered by `createdAt` ascending.
- Prize products are ordered by relation `createdAt` ascending.
- Product photos are ordered by `createdAt` ascending.
