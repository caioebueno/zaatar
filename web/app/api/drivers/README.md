# Drivers API

## Endpoint

`GET /api/drivers`

Returns all drivers ordered by priority and creation date.

`PATCH /api/drivers/:driverId`

Updates driver fields.

Request body:

- `active` (optional boolean)
- `priorityLevel` (optional integer, min `0`)

Notes:

- send at least one field
- when `priorityLevel` is updated, driver priorities are reindexed to remain unique
  (no two drivers share the same `priorityLevel`)

## Response

Success:

```json
[
  {
    "id": "driver-id",
    "createdAt": "2026-04-10T15:00:00.000Z",
    "name": "Carlos",
    "active": true,
    "priorityLevel": 1
  }
]
```

PATCH success:

```json
{
  "id": "driver-id",
  "createdAt": "2026-04-10T15:00:00.000Z",
  "name": "Carlos",
  "active": false,
  "priorityLevel": 1
}
```

Server error:

```json
{
  "error": "Internal Server Error"
}
```

Validation error (`400`):

```json
{
  "error": "Invalid payload",
  "field": "priorityLevel"
}
```

Not found (`404`):

```json
{
  "error": "Driver not found"
}
```
