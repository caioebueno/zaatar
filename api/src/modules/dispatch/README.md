# Dispatch API (API Project)

Base URL (local): `http://localhost:4000`

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
  dispatchAt?: string; // ISO datetime
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
    preparationStepCategory: Array<{
      id: string;
      categoryId: string;
      completed: boolean;
      orderId: string;
      snoozes: unknown[];
      category: {
        id: string;
        title: string;
        products: unknown[];
        translations?: Record<string, Record<string, string>>;
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

Success (`200`) sample:

```json
{
  "id": "dispatch-id",
  "createdAt": "2026-05-13T13:04:11.123Z",
  "queueIndex": 2,
  "dispatchAt": "2026-05-13T13:10:00.000Z",
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
