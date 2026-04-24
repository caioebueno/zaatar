# Internal External Orders Import API

## Endpoint

`POST /api/internal/external-orders/import`

Imports external orders (for example OlaClick payloads) and creates local orders only when they do not already exist.

Deduplication key:

- `externalId` on local `Order`
- resolved from external `public_id` (preferred) or external `id`

Dispatch behavior:

- `TAKEAWAY`: creates a dedicated dispatch (same behavior as normal order creation)
- `DELIVERY`: enqueues `DispatchAssignmentJob` and triggers dispatch queue processing (same assignment pipeline used by checkout)

Authentication:

- if `EXTERNAL_ORDER_IMPORT_SECRET` is configured, send:
  - `Authorization: Bearer <EXTERNAL_ORDER_IMPORT_SECRET>`
- fallback auth secret: `CRON_SECRET`

## Request body

Accepts either:

```json
{
  "data": [
    {
      "id": "external-order-id",
      "public_id": "US-5841997646",
      "service_type": "TAKEAWAY",
      "created_at": "2026-04-24T16:12:47+00:00",
      "scheduled_delivery_date": "2026-04-24T22:00:00+00:00",
      "total": 110.94,
      "total_usd": 110.94,
      "client": {
        "name": "Caio Bueno",
        "country_calling_code": "1",
        "phone_number": "9297669288"
      }
    }
  ]
}
```

Or a direct array of orders.

## Response

Success (`200`):

```json
{
  "received": 1,
  "created": 1,
  "skippedExisting": 0,
  "skippedInvalid": 0,
  "createdOrderIds": ["local-order-id"],
  "skippedExistingExternalIds": [],
  "skippedInvalidEntries": []
}
```

Unauthorized (`401`):

```json
{
  "error": "Unauthorized"
}
```

Server error (`500`):

```json
{
  "error": "Internal Server Error"
}
```
