# Orders API

Base URL (local): `http://localhost:4000`

---

## List Orders

`GET /orders`

Auth: manager access token required.

Returns orders for the active business.

Success (`200`): array of order objects.

---

## Get Order By ID

`GET /orders/:orderId`

Auth: manager access token required.

Success (`200`): order object.

Errors:

- `404`: order not found

---

## Create Order

`POST /orders`

Auth: manager access token required.

---

## Update Order

`PATCH /orders/:orderId`

Auth: manager access token required.

Used to update order fields such as `deliveredAt`.

Request body:

```json
{
  "deliveredAt": "2026-05-15T14:30:00.000Z"
}
```

- `deliveredAt` accepts an ISO datetime string to mark as delivered, or `null` to clear.

Success (`200`):

```json
{
  "id": "order-id",
  "deliveredAt": "2026-05-15T14:30:00.000Z"
}
```

Errors:

- `400`: invalid payload
- `404`: order not found

---

## Update Order (Driver)

`PATCH /drivers/orders/:orderId`

Auth: driver access token required.

Same request/response shape as `PATCH /orders/:orderId`.

Driver permission rule:

- Driver can only update orders belonging to a dispatch assigned to that driver.

Errors:

- `400`: invalid payload
- `403`: forbidden — `reason: DRIVER_ORDER_PERMISSION_DENIED`
- `404`: order not found

---

## Get Orders By Station

`GET /orders-by-station?stationId=:stationId`

Auth: manager access token required.

Returns orders that have pending preparation tracks for the given station, or were created today. Used by the kitchen station display.

Query params:

- `stationId` (required)

Ordering:

1. Dispatch queue order
2. Dispatch creation time
3. Dispatch order index
4. Order creation time

Success (`200`) response schema:

```ts
type OrdersByStationResponse = Array<{
  id: string;
  createdAt: string; // ISO datetime
  scheduleFor: string | null;
  language: string | null;
  paidAt: string | null;
  estimatedDeliveryDurationMinutes: number | null;
  number?: string;
  externalId?: string | null;
  canceled?: boolean;
  status: "ACCEPTED" | "PREPARING" | "DELIVERING" | "DELIVERED";
  type: "DELIVERY" | "TAKEAWAY";
  paymentMethod: "CASH" | "CARD" | "ZELLE";
  paymentProvider?: "STRIPE" | null;
  tip?: number;
  tipAmount?: number;
  addressId?: string;
  address?: {
    id: string;
    createdAt: string;
    description: string;
    lat: string | null;
    lng: string | null;
    city: string | null;
    zipCode: string | null;
    State: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    numberComplement: string | null;
    placeId: string | null;
    googleMapsUrl: string;
  };
  customer?: { id: string; name: string | null };
  redeemedRewards?: Array<{ ... }>; // see dispatch.md DispatchEntity for full shape
  orderProducts: Array<{
    id: string;
    productId: string;
    product?: {
      id: string;
      name: string;
      categoryId?: string;
      description?: string;
      price: number | null;
      comparedAtPrice: number | null;
    };
    amount: number;
    fullAmount: number;
    quantity: number;
  }>;
  preparationTaskStation: Array<{
    id: string;
    stationId?: string;
    completed: boolean;
    orderId: string;
    snoozes: unknown[];
    station: { id: string; name: string };
    steps: Array<{
      id: string;
      name: string;
      quantity: number;
      completed: boolean;
      completedAt?: string;
      goalMinutes: number;
      expectedAt?: string;
      preparationStepId: string;
      preparationStepCategoryId: string;
      comments?: string;
      completedComments: boolean;
      preparationStepModifiers: Array<{
        id: string;
        completed: boolean;
        modifierGroupItem: string;
        modifierGtroupItem: { id: string; name: string; price: number; description?: string };
      }>;
    }>;
  }>;
  productionIndex: number; // 1-based global production order
}>;
```

Sample response:

```json
[
  {
    "id": "order-id",
    "createdAt": "2026-05-17T14:25:11.000Z",
    "status": "PREPARING",
    "type": "DELIVERY",
    "paymentMethod": "CARD",
    "paymentProvider": "STRIPE",
    "customer": { "id": "customer-id", "name": "John Doe" },
    "orderProducts": [
      { "id": "op-id", "productId": "product-id", "amount": 1299, "fullAmount": 1299, "quantity": 1 }
    ],
    "preparationTaskStation": [
      {
        "id": "station-task-id",
        "stationId": "station-id",
        "completed": false,
        "orderId": "order-id",
        "snoozes": [],
        "station": { "id": "station-id", "name": "Kitchen" },
        "steps": [
          {
            "id": "track-id",
            "name": "Prepare",
            "quantity": 1,
            "completed": false,
            "goalMinutes": 12,
            "preparationStepId": "step-id",
            "preparationStepCategoryId": "station-task-id",
            "completedComments": false,
            "preparationStepModifiers": []
          }
        ]
      }
    ],
    "productionIndex": 1
  }
]
```

Errors:

- `400`: missing `stationId`
