# Orders By Station API

## Endpoint

`GET /api/orders-by-station?stationId=:stationId`

Returns station orders with preparation data for today (plus unfinished items), including computed production priority.

## Production Priority

Each returned order includes:

- `productionIndex` (number): 1-based preparation order priority.

`productionIndex` is computed by sorting orders by:

1. dispatch `queueIndex` (ascending)
2. dispatch `createdAt` (ascending)
3. dispatch `id` (ascending, tie-breaker between dispatches)
4. order `dispatchOrderIndex` (ascending, inside the same dispatch)
5. order `createdAt` (ascending)
6. order `id` (ascending, final tie-breaker)

Orders without dispatch queue data are placed after queued dispatch orders.

## Response

Success (`200`):

```json
[
  {
    "id": "order-id",
    "createdAt": "2026-04-16T14:30:00.000Z",
    "productionIndex": 1,
    "dispatchId": "dispatch-id",
    "dispatchOrderIndex": 2,
    "status": "PREPARING",
    "type": "DELIVERY",
    "paymentMethod": "CARD",
    "customer": {
      "id": "customer-id",
      "name": "John"
    },
    "orderProducts": [],
    "preparationStepCategory": []
  }
]
```

Validation error (`400`):

```json
{
  "error": "Missing stationId"
}
```

Server error (`500`):

```json
{
  "error": "Internal Server Error"
}
```
