# Progressive Discount API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## Get Progressive Discount

`GET /progressive-discount`

Returns the progressive discount of one menu, as used by ordering flows.

Query: optional `menuId` (the default menu when omitted).

Selection behavior:

1. Each menu points at zero or one discount (`Menu.progressiveDiscountId`,
   set with `PATCH /menus/:menuId`). Several menus may share one discount.
2. Returns `null` when that menu has no discount attached, or when its discount
   is `completed` — completing a discount retires it on every menu.

## List Progressive Discounts

`GET /progressive-discount/all`

Returns every progressive discount, newest first, each with the same shape as
`GET /progressive-discount` plus `menuIds` — the menus it is attached to. Use it
for management UIs; ordering flows should keep using `GET /progressive-discount`.

Returns `[]` when no discount exists (never `null`).

## Create Progressive Discount

`POST /progressive-discount`

Creates a progressive discount and all of its steps. `completed` defaults to `false`.

```json
{
  "completed": false,
  "steps": [
    { "type": "PERCENTAGEDISCOUNT", "amount": 3000, "discount": 10 },
    { "type": "GIFT", "amount": 5000 }
  ]
}
```

`amount` is in cents. A `PERCENTAGEDISCOUNT` step requires an integer `discount`; a `GIFT` step must omit it. Returns the created configuration (`201`).

## Update Progressive Discount

`PATCH /progressive-discount/:id`

Updates `completed`, replaces all steps, or does both.

```json
{
  "completed": false,
  "steps": [
    { "type": "PERCENTAGEDISCOUNT", "amount": 4000, "discount": 15 }
  ]
}
```

When `steps` is provided, the API replaces the full step list atomically. This also removes prizes attached to the replaced steps. Returns the updated configuration (`200`).

## Delete Progressive Discount

`DELETE /progressive-discount/:id`

Deletes the configuration, its steps, and prizes. Returns `204`.

### Success (`200`) schema

```ts
type ProgressiveDiscountResponse = {
  id: string;
  createdAt: string; // ISO datetime
  completed: boolean;
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
  "createdAt": "2026-05-20T09:00:00.000Z",
  "completed": false,
  "steps": [
    {
      "id": "step-01",
      "type": "PERCENTAGEDISCOUNT",
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
