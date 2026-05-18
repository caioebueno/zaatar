# Orders API (API Project)

Base URL (local): `http://localhost:4000`

## Get Orders By Station

Endpoint:

- `GET /orders-by-station?stationId=:stationId` (manager auth)

Authentication:

- Requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`

Query params:

- `stationId` (required): station id to filter preparation tracks.

Behavior:

- Returns orders that either:
  - have pending preparation tracks for the provided station, or
  - were created today.
- Keeps the same ordering behavior used by the web route:
  - dispatch queue order first
  - then dispatch creation
  - then dispatch order index
  - then order creation.

Success (`200`):

- Returns an array of station-preparation-ready orders (same shape used by web station flow), including:
  - `id`, `createdAt`, `status`, `type`, `paymentMethod`
  - `customer`, `address`, `orderProducts`
  - `preparationTaskStation`
  - `productionIndex`

Response schema (in depth):

```ts
type OrdersByStationResponse = Array<{
  id: string;
  createdAt: string; // ISO datetime
  scheduleFor: string | null; // ISO datetime
  language: string | null;
  paidAt: string | null; // ISO datetime
  progressiveDiscountSnapshot?: unknown;
  estimatedDeliveryDurationMinutes: number | null;
  number?: string;
  externalId?: string | null;
  canceled?: boolean;
  status: "ACCEPTED" | "PREPARING" | "DELIVERING" | "DELIVERED";
  type: "DELIVERY" | "TAKEAWAY";
  paymentMethod: "CASH" | "CARD" | "ZELLE";
  paymentProvider?: "STRIPE" | null;
  tip?: number; // percent
  tipAmount?: number; // percent
  addressId?: string;
  address?: {
    id: string;
    createdAt: string; // ISO datetime
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
  customer?: {
    id: string;
    name: string | null;
  };
  redeemedRewards?: Array<{
    id: string;
    customerId: string;
    status: "ACTIVE" | "REDEEMED" | "EXPIRED" | "CANCELED";
    type: "FREE_PRODUCT" | "PERCENT_DISCOUNT" | "FIXED_DISCOUNT" | "CUSTOM";
    title: string;
    description?: string;
    quantity?: number | null;
    value?: number | null;
    couponCode?: string | null;
    issuedAt: string; // ISO datetime
    expiresAt: string | null; // ISO datetime
    redeemedAt: string | null; // ISO datetime
    productId?: string | null;
    product?: {
      id: string;
      name: string;
      categoryId?: string;
      description?: string;
      price: number | null;
      comparedAtPrice: number | null;
      translations?: Record<string, Record<string, string>>;
    };
  }>;
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
      translations?: Record<string, Record<string, string>>;
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
    station: {
      id: string;
      name: string;
    };
    steps: Array<{
      id: string;
      name: string;
      quantity: number;
      completed: boolean;
      completedAt?: string; // ISO datetime
      goalMinutes: number;
      expectedAt?: string; // ISO datetime
      preparationStepId: string;
      preparationStepCategoryId: string;
      comments?: string;
      completedComments: boolean;
      preparationStepModifiers: Array<{
        id: string;
        completed: boolean;
        modifierGroupItem: string; // modifier item id
        modifierGtroupItem: {
          // kept as-is in payload (legacy key spelling)
          id: string;
          name: string;
          price: number;
          description?: string;
        };
      }>;
    }>;
  }>;
  productionIndex: number; // 1-based global production order
}>;
```

Success (`200`) sample:

```json
[
  {
    "id": "order-id",
    "createdAt": "2026-05-17T14:25:11.000Z",
    "scheduleFor": null,
    "language": "en",
    "paidAt": "2026-05-17T14:25:12.000Z",
    "estimatedDeliveryDurationMinutes": 27,
    "number": "128",
    "status": "PREPARING",
    "type": "DELIVERY",
    "paymentMethod": "CARD",
    "paymentProvider": "STRIPE",
    "tip": 10,
    "tipAmount": 10,
    "customer": {
      "id": "customer-id",
      "name": "John Doe"
    },
    "orderProducts": [
      {
        "id": "order-product-id",
        "productId": "product-id",
        "amount": 1299,
        "fullAmount": 1299,
        "quantity": 1
      }
    ],
    "preparationTaskStation": [
      {
        "id": "station-task-group-id",
        "stationId": "station-id",
        "completed": false,
        "orderId": "order-id",
        "snoozes": [],
        "station": {
          "id": "station-id",
          "name": "Kitchen"
        },
        "steps": [
          {
            "id": "track-id",
            "name": "Prepare",
            "quantity": 1,
            "completed": false,
            "goalMinutes": 12,
            "preparationStepId": "step-id",
            "preparationStepCategoryId": "station-task-group-id",
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

Common errors:

- `400`: missing `stationId`

## Update Order Delivery Timestamp

Endpoints:

- `PATCH /orders/:orderId` (manager auth)
- `PATCH /drivers/orders/:orderId` (driver auth)

Authentication:

- Manager route requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`
- Driver route requires driver access token:
  - `Authorization: Bearer <driver-access-token>`

Driver permission rule:

- Driver can update only orders that belong to a dispatch assigned to that same driver.

Request body:

```json
{
  "deliveredAt": "2026-05-15T14:30:00.000Z"
}
```

Notes:

- `deliveredAt` accepts:
  - ISO datetime string to mark as delivered
  - `null` to clear delivery timestamp

Success (`200`):

```json
{
  "id": "order-id",
  "deliveredAt": "2026-05-15T14:30:00.000Z"
}
```

Common errors:

- `400`: invalid payload (for example invalid `deliveredAt` type/format)
- `404`: order not found
- `403`: forbidden for driver (`reason: DRIVER_ORDER_PERMISSION_DENIED`)
