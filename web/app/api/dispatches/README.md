# Dispatches API

## Endpoint

`GET /api/dispatches`

Returns all today's dispatches. For non-today dispatches, returns only those that are not dispatched yet or still have pending (undelivered) orders.

`PATCH /api/dispatches/:dispatchId`

Updates dispatch status fields:

- `dispatched` (required boolean)
- `dispatchAt` (optional ISO string or `null`)
- `dispatchedAt` is also accepted as an alias of `dispatchAt`

`GET /api/dispatches/next?driverId=:driverId`

Returns the next pending dispatch for the provided driver, including dispatches already marked as dispatched, as long as there are undelivered orders. Prioritizes already-dispatched dispatches first, then oldest by dispatch time/creation time. Returns `null` when no dispatch is available.

Each dispatch can include:

- `driver`: the linked driver when one is assigned
- `dispatched`: whether the dispatch has already gone out
- `dispatchAt`: timestamp of when the dispatch was marked as dispatched
- `estimatedDeliveryDurationMinutes`: estimated time to complete the remaining deliveries in the dispatch
- `estimatedRoundTripDurationMinutes`: estimated time to complete the remaining deliveries and return to the store
- `orders`: the grouped delivery orders, including `delivered`, `orderProducts`, and `deliveryAddress`

Order payload notes:

- orders do not include a `status` field
- `delivered` is the frontend-friendly boolean derived for each order
- `paidAt` is included as an ISO timestamp when the order has been paid (otherwise `null`)
- `deliveredAt` is included when the order has been marked as delivered
- `customer` is included on each order
- `deliveryAddress` is included when the order has one
- `orderProducts` includes the selected product data and modifier selections

## Response

Success:

```json
[
  {
    "id": "dispatch-id",
    "createdAt": "2026-04-06T15:30:00.000Z",
    "dispatched": false,
    "estimatedDeliveryDurationMinutes": 24,
    "estimatedRoundTripDurationMinutes": 33,
    "driverId": "driver-id",
    "driver": {
      "id": "driver-id",
      "createdAt": "2026-04-06T15:10:00.000Z",
      "name": "Carlos",
      "active": true,
      "priorityLevel": 1
    },
    "orders": [
      {
        "id": "order-1",
        "createdAt": "2026-04-06T15:20:00.000Z",
        "number": "1042",
        "delivered": false,
        "type": "DELIVERY",
        "paymentMethod": "CARD",
        "dispatchId": "dispatch-id",
        "costumerId": "customer-1",
        "customer": {
          "id": "customer-1",
          "name": "John"
        },
        "deliveryAddress": {
          "id": "address-1",
          "createdAt": "2026-04-06T15:00:00.000Z",
          "description": "Home",
          "street": "Main St",
          "number": "123",
          "complement": "Apt 4B",
          "city": "Kissimmee",
          "state": "FL",
          "zipCode": "34747",
          "lat": "28.35",
          "lng": "-81.64",
          "deliveryFee": 420
        },
        "orderProducts": [
          {
            "id": "order-product-1",
            "productId": "product-1",
            "product": {
              "id": "product-1",
              "name": "Mozzarella Pizza"
            },
            "amount": 2199,
            "fullAmount": 2199,
            "quantity": 1,
            "selectedModifierGroupItemIds": [],
            "selectedModifierGroupItems": []
          }
        ],
        "preparationStepCategory": []
      },
      {
        "id": "order-2",
        "createdAt": "2026-04-06T15:25:00.000Z",
        "number": "1043",
        "delivered": true,
        "type": "DELIVERY",
        "paymentMethod": "CASH",
        "dispatchId": "dispatch-id",
        "costumerId": "customer-2",
        "customer": {
          "id": "customer-2",
          "name": "Maria"
        },
        "orderProducts": [],
        "preparationStepCategory": []
      }
    ]
  }
]
```

Server error:

```json
{
  "error": "Internal Server Error"
}
```
