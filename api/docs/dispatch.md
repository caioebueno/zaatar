# Dispatch API

Base URL (local): `http://localhost:4000`

---

## DispatchEntity Shape

The following shape is returned by all dispatch endpoints:

```ts
type DispatchEntity = {
  id: string;
  createdAt: string; // ISO datetime
  queueIndex?: number;
  dispatchAt?: string; // ISO datetime (legacy, do not use for status logic)
  startedDeliveryAt?: string; // ISO datetime — canonical delivery start timestamp
  status: "PREPARING" | "READY_FOR_DELIVERY" | "OUT_FOR_DELIVERY" | "DELIVERED";
  latestRoutePoint?: {
    id: string;
    sessionId: string;
    sequence: number;
    createdAt: string;
    recordedAt: string;
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
    createdAt: string;
    name: string;
    active: boolean;
    priorityLevel: number;
  };
  orders: Array<{
    id: string;
    createdAt: string;
    scheduleFor: string | null;
    language: string | null;
    paidAt: string | null;
    delivered: boolean;
    type: string;
    paymentMethod: string;
    tip?: number;
    tipAmount?: number;
    dispatchId?: string;
    dispatchOrderIndex: number;
    estimatedDeliveryDurationMinutes: number | null;
    number?: string;
    externalId: string | null;
    customer?: { id: string; name: string | null; phone: string | null };
    deliveryAddress?: {
      id: string;
      createdAt: string;
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
      issuedAt: string;
      expiresAt: string | null;
      redeemedAt: string | null;
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
      station: { id: string; name: string };
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
          modifierGroupItem: string;
          modifierGtroupItem: {
            id: string;
            name: string;
            price: number;
            description?: string;
            photo?: { id: string; url: string };
            translations?: Record<string, Record<string, string>>;
          };
        }>;
      }>;
    }>;
  }>;
};
```

### Dispatch Status Logic

| Status | Condition |
|---|---|
| `DELIVERED` | All orders in the dispatch are delivered |
| `OUT_FOR_DELIVERY` | `startedDeliveryAt` is set and not all orders are delivered |
| `READY_FOR_DELIVERY` | All order preparation tasks are complete and not yet out for delivery |
| `PREPARING` | Some preparation tasks are still in progress |

---

## Manager Routes

### List Dispatches

`GET /dispatches`

Auth: manager access token required.

Returns dispatches using the same visibility logic as the dispatch board:
- Today's dispatches
- Non-today dispatches that are not dispatched yet or still have pending orders

Ordered by: `dispatched` → `queueIndex` → dispatch/create time.

Query params:

- `status=active` — returns only active dispatches (driver has `startedDeliveryAt` set, has undelivered orders, and hasn't started a newer dispatch)

Examples:

```
GET /dispatches
GET /dispatches?status=active
```

Success (`200`): `DispatchEntity[]`

Validation error (`400`):

```json
{ "error": "Invalid payload", "field": "status" }
```

---

### Update Dispatch (Assign/Unassign Driver)

`PATCH /dispatches/:dispatchId`

Auth: manager access token required.

Request body:

```json
{ "driverId": "driver-id" }
```

To unassign:

```json
{ "driverId": null }
```

Success (`200`): updated `DispatchEntity`.

Errors:

- `400`: invalid payload
- `404`: dispatch not found
- `404`: driver not found

---

### Move Dispatch Order

`PATCH /dispatches/orders/:orderId`

Auth: manager access token required.

Moves an order to a different dispatch or reorders within a dispatch.

---

## Driver Routes

### Get Next Dispatch For Driver

`GET /dispatches/next`

Auth: driver access token required.

Returns the next dispatch assigned to the authenticated driver, or `null` if none.

Success (`200`): `DispatchEntity | null`

```json
null
```

or the full `DispatchEntity` object.

Auth errors (`401`):

```json
{ "error": "Unauthorized" }
```

---

### List Driver Dispatches By Date Range

`GET /drivers/dispatches?startDate=:startDate&endDate=:endDate`

Auth: driver access token required.

Returns dispatch history for the authenticated driver in the given date range. Date filtering uses `Dispatch.createdAt`.

Query params:

- `startDate` (required): date or datetime string. Alias: `start`
- `endDate` (required): date or datetime string. Alias: `end`

Date behavior:

- `YYYY-MM-DD` input: `startDate` → `00:00:00.000Z`, `endDate` → `23:59:59.999Z`

Success (`200`): `DispatchEntity[]`

Validation errors (`400`):

```json
{ "error": "Invalid payload", "field": "startDate" }
{ "error": "Invalid payload", "field": "endDate" }
{ "error": "Invalid payload", "field": "dateRange" }
```

---

### Set Dispatch Started Delivery At

`PATCH /drivers/dispatches/:dispatchId/started-delivery`

Auth: driver access token required.

Sets `Dispatch.startedDeliveryAt`. Only the assigned driver can call this. Also ensures an active `DispatchRouteSession` exists (created automatically if missing).

Request body:

```json
{ "startedDeliveryAt": "2026-05-15T16:25:00.000Z" }
```

- `startedDeliveryAt` is optional; defaults to server time if omitted.

Success (`200`):

```json
{
  "ok": true,
  "dispatchId": "dispatch-id",
  "startedDeliveryAt": "2026-05-15T16:25:00.000Z"
}
```

Errors:

- `400`: invalid `startedDeliveryAt` format
- `403`: driver is not assigned to this dispatch — `reason: DRIVER_DISPATCH_ACCESS_DENIED`
- `404`: dispatch not found
