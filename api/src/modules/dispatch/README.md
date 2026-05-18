# Dispatch API (API Project)

Base URL (local): `http://localhost:4000`

## List Dispatches (Manager Owner Auth)

Endpoint:

`GET /dispatches`

Description:

- Returns dispatches using the same visibility logic as the existing dispatch board:
  - today's dispatches
  - plus non-today dispatches that are not dispatched yet or still have pending orders
- Ordered by `dispatched`, then `queueIndex`, then dispatch/create time.
- Supports query filters.

Authentication:

- Requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`

Query filters:

- `status=active`
  - Returns only active dispatches.
  - Active means:
    - `startedDeliveryAt` is set
    - dispatch still has undelivered orders
    - driver has not started a newer active dispatch

Examples:

- `GET /dispatches`
- `GET /dispatches?status=active`

Success (`200`):

- Returns `DispatchEntity[]` (same shape documented below in "Get Next Dispatch For Driver").

Validation error (`400`):

```json
{
  "error": "Invalid payload",
  "field": "status"
}
```

## Update Dispatch Driver (Manager Owner Auth)

Endpoint:

`PATCH /dispatches/:dispatchId`

Description:

- Assigns or unassigns a driver from a dispatch.
- `dispatchAt` is legacy and not used by this endpoint.

Authentication:

- Requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`

Request body:

```json
{
  "driverId": "driver-id"
}
```

To unassign driver:

```json
{
  "driverId": null
}
```

Success (`200`):

- Returns updated `DispatchEntity`.

Errors:

- `400` invalid payload (for example missing/invalid `driverId`)
- `404` dispatch not found
- `404` driver not found

## Get Next Dispatch For Driver

Endpoint:

`GET /dispatches/next`

Description:

- Returns the next dispatch assigned to the authenticated driver.
- Matches the `/web` behavior for dispatch selection and payload shape.
- If no dispatch is found, returns `null` with status `200`.

Authentication:

- Requires driver access token in header:
  - `Authorization: Bearer <driver-access-token>`
- Driver access token is returned by:
  - `POST /drivers/auth/otp/verify`

Success (`200`) full response shape:

```ts
type GetNextDispatchResponse = DispatchEntity | null;

type DispatchEntity = {
  id: string;
  createdAt: string; // ISO datetime
  queueIndex?: number;
  dispatchAt?: string; // ISO datetime (legacy)
  startedDeliveryAt?: string; // ISO datetime
  status: "PREPARING" | "READY_FOR_DELIVERY" | "OUT_FOR_DELIVERY" | "DELIVERED";
  latestRoutePoint?: {
    id: string;
    sessionId: string;
    sequence: number;
    createdAt: string; // ISO datetime
    recordedAt: string; // ISO datetime
    lat: number;
    lng: number;
    accuracyMeters: number | null;
    speedMps: number | null;
    headingDegrees: number | null;
    altitudeMeters: number | null;
    source: string;
    isMocked: boolean | null;
  };
  dispatched: boolean;
  estimatedDeliveryDurationMinutes?: number;
  estimatedRoundTripDurationMinutes?: number;
  driverId?: string;
  driver?: {
    id: string;
    createdAt: string; // ISO datetime
    name: string;
    active: boolean;
    priorityLevel: number;
  };
  orders: Array<{
    id: string;
    createdAt: string; // ISO datetime
    scheduleFor: string | null; // ISO datetime
    language: string | null;
    paidAt: string | null; // ISO datetime
    progressiveDiscountSnapshot?: unknown;
    deliveredAt?: string; // ISO datetime
    estimatedDeliveryDurationMinutes: number | null;
    dispatchOrderIndex: number;
    number?: string;
    externalId: string | null;
    delivered: boolean;
    type: string;
    paymentMethod: string;
    tip?: number;
    tipAmount?: number;
    dispatchId?: string;
    costumerId?: string; // kept for backward compatibility
    customer?: {
      id: string;
      name: string | null;
      phone: string | null;
    };
    deliveryAddress?: {
      id: string;
      createdAt: string; // ISO datetime
      description: string;
      street: string;
      number: string;
      city: string;
      state: string;
      zipCode: string;
      lat: string;
      lng: string;
      complement?: string;
      numberComplement?: string;
      customerId?: string;
      deliveryFee?: number;
    };
    redeemedRewards: Array<{
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
      product: {
        id: string;
        name: string;
        description: string | null;
        price: number | null;
        categoryId: string | null;
        comparedAtPrice: number | null;
        translations?: Record<string, Record<string, string>>;
      };
      comments?: string;
      selectedModifierGroupItemIds: string[];
      selectedModifierGroupItems: Array<{
        id: string;
        name: string;
        description?: string;
        price: number;
        translations?: Record<string, Record<string, string>>;
      }>;
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
        preparationStepId: string;
        preparationStepCategoryId: string;
        comments?: string;
        completedComments: string | null;
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
            photo?: {
              id: string;
              url: string;
            };
            translations?: Record<string, Record<string, string>>;
          };
        }>;
      }>;
    }>;
  }>;
};
```

Notes:

- `startedDeliveryAt` is the canonical public delivery start timestamp.
- Route tracking APIs do not expose route session `startedAt`.
- `dispatchAt` is legacy and should not be used for new dispatch status logic.
- Dispatch status logic:
  - `DELIVERED`: all dispatch orders are delivered
  - `OUT_FOR_DELIVERY`: `startedDeliveryAt` is set and not all orders are delivered
  - `READY_FOR_DELIVERY`: all order tasks are ready (no incomplete preparation tasks) and dispatch is not out for delivery yet
  - `PREPARING`: fallback when tasks are still in progress

Success (`200`) sample:

```json
{
  "id": "dispatch-id",
  "createdAt": "2026-05-13T13:04:11.123Z",
  "queueIndex": 2,
  "dispatchAt": "2026-05-13T13:10:00.000Z",
  "startedDeliveryAt": "2026-05-13T13:18:00.000Z",
  "status": "OUT_FOR_DELIVERY",
  "latestRoutePoint": {
    "id": "route-point-id",
    "sessionId": "route-session-id",
    "sequence": 18,
    "createdAt": "2026-05-13T13:19:01.000Z",
    "recordedAt": "2026-05-13T13:19:00.000Z",
    "lat": 27.9506,
    "lng": -82.4572,
    "accuracyMeters": 5,
    "speedMps": 9.4,
    "headingDegrees": 200,
    "altitudeMeters": 3.2,
    "source": "GPS",
    "isMocked": false
  },
  "dispatched": true,
  "estimatedDeliveryDurationMinutes": 24,
  "estimatedRoundTripDurationMinutes": 39,
  "driverId": "driver-id",
  "driver": {
    "id": "driver-id",
    "createdAt": "2026-04-10T15:00:00.000Z",
    "name": "Carlos",
    "active": true,
    "priorityLevel": 1
  },
  "orders": []
}
```

No dispatch (`200`):

```json
null
```

Auth errors (`401`):

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

## Set Dispatch Started Delivery At (Driver)

Endpoint:

`PATCH /drivers/dispatches/:dispatchId/started-delivery`

Description:

- Sets `Dispatch.startedDeliveryAt`.
- Only the driver assigned to that dispatch can update it.
- Driver identity is read from driver access token.
- Also ensures an active `DispatchRouteSession` exists for this dispatch+driver (created automatically if missing).

Authentication:

- Requires driver access token in header:
  - `Authorization: Bearer <driver-access-token>`

Request body:

```json
{
  "startedDeliveryAt": "2026-05-15T16:25:00.000Z"
}
```

- `startedDeliveryAt` is optional. If omitted, server uses current time.

Success (`200`):

```json
{
  "ok": true,
  "dispatchId": "dispatch-id",
  "startedDeliveryAt": "2026-05-15T16:25:00.000Z"
}
```

Validation error (`400`):

```json
{
  "error": "Invalid payload",
  "field": "startedDeliveryAt"
}
```

Forbidden (`403`):

```json
{
  "error": "Forbidden",
  "reason": "DRIVER_DISPATCH_ACCESS_DENIED"
}
```

Not found (`404`):

```json
{
  "error": "Dispatch not found"
}
```
