# POS Exclusive Promotions API

## Endpoint

`GET /api/pos/exclusive-promotions`

Returns exclusive promotions formatted for POS usage, including attached product data and an `availableNow` flag.
For combo products, response includes `comboLineItems` (combo slots + options).

## Query params

- `onlyAvailable` (optional, default `true`):
  - `true` / `1`: return only currently available promotions
  - `false` / `0`: return all promotions with computed availability
- `at` (optional): ISO date-time used to evaluate availability (defaults to current server time)
- `timezone` (optional): IANA timezone used for weekday checks (defaults to `EXCLUSIVE_PROMOTION_TIMEZONE` or `America/New_York`)

## Availability rules

A promotion is considered available when:

- `active = true`
- `expireAt` is null or greater than `at`
- `validWeekdays` is empty OR contains the weekday for `at` in the chosen timezone

## Response shape

```json
{
  "timezone": "America/New_York",
  "at": "2026-05-04T15:00:00.000Z",
  "weekday": "MONDAY",
  "onlyAvailable": true,
  "promotions": [
    {
      "id": "promo-id",
      "name": "Lunch Deal",
      "active": true,
      "expireAt": null,
      "validWeekdays": ["MONDAY", "TUESDAY"],
      "availableNow": true,
      "productIds": ["product-id"],
      "products": [
        {
          "id": "product-id",
          "name": "Combo #1",
          "itemType": "COMBO",
          "visible": true,
          "price": 1299,
          "comparedAtPrice": 1599,
          "translations": null,
          "photos": [],
          "comboLineItems": [
            {
              "id": "slot-1",
              "name": "Select your pizza",
              "translations": {
                "es": { "title": "Elige tu pizza" },
                "pt": { "title": "Escolha sua pizza" }
              },
              "minSelect": 1,
              "maxSelect": 1,
              "allowDuplicates": false,
              "sortIndex": 1,
              "options": [
                {
                  "productId": "pizza-1",
                  "productName": "Margherita",
                  "productTranslations": null,
                  "extraPrice": 0,
                  "sortIndex": 1
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
