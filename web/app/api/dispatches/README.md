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

`PATCH /api/dispatches/orders/:orderId`

Moves/repositions an order in dispatch queues.

Request body fields:

- `createNewDispatch` (optional boolean): when `true`, creates a new dispatch and places the order there
- `targetDispatchId` (optional string): destination dispatch id; omit it to reorder inside the order's current dispatch
- `targetIndex` (optional positive integer): 1-based order position inside destination dispatch; when omitted, appends to the end

Supported actions:

- create a new dispatch with this order
- move order to another dispatch at a specific index
- reorder order within its current dispatch

Examples:

Create new dispatch with the order:

```json
{
  "createNewDispatch": true
}
```

Move order to another dispatch at position 1:

```json
{
  "targetDispatchId": "dispatch-id",
  "targetIndex": 1
}
```

Reorder inside current dispatch to position 2:

```json
{
  "targetIndex": 2
}
```

Response shape:

```json
{
  "orderId": "order-id",
  "sourceDispatchId": "from-dispatch-id",
  "targetDispatchId": "to-dispatch-id",
  "targetIndex": 2,
  "createdDispatch": false,
  "sourceDispatchDeleted": true
}
```

When moving an order out of a dispatch, if the source dispatch is left with zero orders, it is automatically deleted.

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
- `dispatchOrderIndex` is always included as a 1-based position inside the dispatch
- `scheduleFor` is included as an ISO timestamp when the order is scheduled (otherwise `null`)
- `paidAt` is included as an ISO timestamp when the order has been paid (otherwise `null`)
- `deliveredAt` is included when the order has been marked as delivered
- `progressiveDiscountSnapshot` is included when the order has a stored progressive discount snapshot (including selected prize data)
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
        "scheduleFor": "2026-04-06T17:00:00.000Z",
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
        "progressiveDiscountSnapshot": {
          "progressiveDiscount": {
            "id": "progressive-discount-1",
            "steps": [
              {
                "id": "step-1",
                "type": "PERCENTAGEDISCOUNT",
                "amount": 3000,
                "discount": 10,
                "prizes": []
              },
              {
                "id": "step-2",
                "type": "GIFT",
                "amount": 5000,
                "discount": null,
                "prizes": [
                  {
                    "id": "prize-1",
                    "name": "Free Sfihas",
                    "quantity": 3,
                    "imageUrl": "https://cdn.example.com/prizes/sfiha.png",
                    "progressiveDiscountStepId": "step-2",
                    "products": [
                      {
                        "id": "product-10",
                        "name": "Nutella Sfiha",
                        "price": 799,
                        "comparedAtPrice": null,
                        "photos": [],
                        "translations": {
                          "en": {
                            "title": "Nutella Sfiha"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "appliedStep": {
            "id": "step-2",
            "type": "GIFT",
            "amount": 5000,
            "discount": null,
            "prizes": []
          },
          "fullPrice": 5600,
          "discountedPrice": 5040,
          "discountAmount": 560,
          "selectedPrize": {
            "prizeId": "prize-1",
            "prizeName": "Free Sfihas",
            "quantity": 3,
            "selectedProductIds": ["product-10", "product-10", "product-10"],
            "selectedProductCounts": [
              {
                "productId": "product-10",
                "quantity": 3
              }
            ],
            "availableProducts": [
              {
                "id": "product-10",
                "name": "Nutella Sfiha",
                "price": 799,
                "comparedAtPrice": null,
                "photos": [],
                "translations": {
                  "en": {
                    "title": "Nutella Sfiha"
                  }
                }
              }
            ]
          }
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
        "scheduleFor": null,
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
        "progressiveDiscountSnapshot": null,
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
