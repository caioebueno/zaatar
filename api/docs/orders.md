# Orders API

Base URL (local): `http://localhost:4000`

---

## List Orders

`GET /orders`

Auth: manager access token required.

Returns orders for the active business.

Success (`200`): array of order objects.

```ts
type OrderPayment = {
  amount: number; // cents
  paidAt: string | null; // ISO datetime
  paymentType: "CASH" | "CARD" | "ZELLE";
};

type OrderListItem = {
  id: string;
  number: string | null;
  createdAt: string; // ISO datetime
  orderType: "DELIVERY" | "TAKEAWAY";
  paymentMethod: "CARD" | "CASH" | "ZELLE";
  payments: OrderPayment[];
  status: string;
  canceled: boolean;
  customerName: string | null;
  customerPhone: string | null;
  totalCents: number;
};
```

---

## Get Order By ID

`GET /orders/:orderId`

Auth: manager access token required.

Success (`200`): order object.

```ts
type OrderDetail = {
  id: string;
  number: string | null;
  createdAt: string; // ISO datetime
  orderType: "DELIVERY" | "TAKEAWAY";
  paymentMethod: "CARD" | "CASH" | "ZELLE";
  payments: OrderPayment[];
  status: string;
  canceled: boolean;
  customer: { name: string | null; phone: string | null };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitAmountCents: number;
    lineTotalCents: number;
  }>;
  subtotalCents: number;
  discountedSubtotalCents: number;
  tipPercent: number;
  tipAmountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};
```

Payment compatibility rule: if the order has no `OrderPayment` rows, the API returns a single payment derived from legacy fields: total amount, `paidAt`, and `paymentMethod`.

Errors:

- `404`: order not found

---

## Create Order

`POST /orders`

Auth: manager access token required.

Creates an order for POS/manager flows and returns the created order with products, modifiers, customer, address, and dispatch relation when present.

After successful creation, the API also attempts to send an order-confirmation WhatsApp message via Chatwoot when:

- the order has a customer with a phone number
- the order is attached to a branch with `chatwootAccountId` and `chatwootSourceId` configured
- `CHATWOOT_API_ACCESS_TOKEN` is configured
- `DISABLE_WHATSAPP_MESSAGING` is not enabled

This notification is non-blocking: order creation still returns `201` even if message send fails.

Order confirmation is sent as a Chatwoot WhatsApp template (`template_params`) using `order_confirmation` by default, with 4 body variables:

1. Customer name
2. Order number
3. Total amount (without `$`)
4. Order type label (localized)

Optional env overrides:

- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_NAME_EN`
- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_NAME_PT`
- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_NAME_ES`
- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_NAME` (fallback)
- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_CATEGORY` (default: `UTILITY`)
- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_PREVIEW_EN`
- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_PREVIEW_PT`
- `CHATWOOT_ORDER_CONFIRMATION_TEMPLATE_PREVIEW_ES`

Preview envs are optional and control the text shown inside Chatwoot UI. Use `{{1}}..{{4}}` placeholders for:
1) customer name, 2) order number, 3) total amount (no `$`), 4) order type label.

### Request Body (schema)

```ts
type CreateOrderBody = {
  cart: {
    items: Array<{
      cartId: string;
      productId: string;
      quantity: number; // integer > 0
      description?: string;
      modifiers: Array<{
        modifierId: string;
        modifierItemId: string;
      }>;
      comboSelections?: Array<{
        slotId: string;
        optionProductId: string;
        quantity: number; // integer > 0
      }>;
    }>;
  };
  customerId?: string | null;
  orderType: "DELIVERY" | "TAKEAWAY";
  paymentMethod: "CARD" | "CASH" | "ZELLE";
  paymentProvider?: "STRIPE" | null;
  language?: string;
  scheduleFor?: string | null; // ISO datetime
  addressId?: string | null; // required when orderType=DELIVERY
  orderIntentId?: string | null; // when provided, API sets this OrderIntent active=false after creating the order
  tipAmount?: number; // integer > 0
  branchId?: string | null;
};
```

### Important Validation Rules

- `cart.items` is required and must contain at least 1 item.
- `modifiers` must be an array of objects (`{ modifierId, modifierItemId }`), not an array of strings.
- If provided, every `comboSelections` item must match a valid `slotId + optionProductId` for that product.
- `orderType="DELIVERY"` requires `addressId`.
- `customerId` and `addressId` are validated against existing records when provided.
- `paymentProvider` currently accepts only `"STRIPE"`.

### Branch Assignment Rule

- If `branchId` is provided, it is used.
- If `branchId` is omitted and the authenticated business has exactly 1 branch, that branch is auto-attached.
- If multiple branches exist and `branchId` is omitted, order is created without forced branch assignment.

### Pricing Behavior

For each cart item:

- `amount = product.price + selected modifier items + combo extra prices`
- `fullAmount = (product.comparedAtPrice ?? product.price) + selected modifier items + combo extra prices`

Order amount:

- `order.amount = Σ(item.amount * item.quantity)`

### Example Request (simple product)

```json
{
  "cart": {
    "items": [
      {
        "cartId": "2d1e1b1d-8e27-4f4c-9bb2-a2f57d4d4d01",
        "productId": "7c0da998-05a1-4392-a13e-a98e51213749",
        "quantity": 1,
        "modifiers": [
          {
            "modifierId": "f4f44520-0f9f-4e5d-a20f-5127ea9e44ae",
            "modifierItemId": "95a2f9a7-8b2f-49e1-b5d5-17f61aa2ab11"
          }
        ]
      }
    ]
  },
  "customerId": "b406d9b6-eedb-4d7a-8dd2-580b656df3ec",
  "orderType": "TAKEAWAY",
  "paymentMethod": "CASH",
  "language": "en"
}
```

### Example Request (combo with slot selections)

```json
{
  "cart": {
    "items": [
      {
        "cartId": "a4ab2670-8089-44ea-8c8f-7dfb86617e17",
        "productId": "7c0da998-05a1-4392-a13e-a98e51213749",
        "quantity": 1,
        "modifiers": [],
        "comboSelections": [
          {
            "slotId": "0d41b12f-1dea-4336-91a0-7b42df0a8f52",
            "optionProductId": "9fdef81a-e487-4ba1-99bb-918b1b75ac95",
            "quantity": 1
          }
        ]
      }
    ]
  },
  "orderType": "DELIVERY",
  "paymentMethod": "CARD",
  "paymentProvider": "STRIPE",
  "addressId": "9cb035e1-fb47-47d0-83e3-db45fcc7d0b2"
}
```

### Success Response (`201`)

Returns the created order object with:

- order fields (`id`, `amount`, `type`, `status`, `paymentMethod`, `paymentProvider`, timestamps)
- `customer`
- `deliveryAddress`
- `orderProducts` including:
  - `product`
  - `modifierGroupItems`
- `dispatch` (if already attached)

Example (truncated):

```json
{
  "id": "5d51b470-9b4d-4a89-b2c0-9b3651f4a212",
  "amount": 1999,
  "type": "DELIVERY",
  "paymentMethod": "CARD",
  "paymentProvider": "STRIPE",
  "createdAt": "2026-05-24T13:10:25.144Z",
  "orderProducts": [
    {
      "id": "6cc2d0db-78f2-4e6e-a2d3-1f5196ef7752",
      "productId": "7c0da998-05a1-4392-a13e-a98e51213749",
      "amount": 1999,
      "fullAmount": 2299,
      "quantity": 1,
      "modifierGroupItems": []
    }
  ]
}
```

### Error Response

Validation errors return:

```json
{
  "error": "Invalid payload",
  "field": "cart.items.modifiers"
}
```

Common `field` values:

- `cart`
- `cart.items`
- `cart.items.cartId`
- `cart.items.productId`
- `cart.items.quantity`
- `cart.items.modifiers`
- `cart.items.modifiers.modifierId`
- `cart.items.modifiers.modifierItemId`
- `cart.items.comboSelections`
- `cart.items.comboSelections.slotId`
- `cart.items.comboSelections.optionProductId`
- `cart.items.comboSelections.quantity`
- `addressId`
- `customerId`
- `paymentMethod`
- `paymentProvider`
- `orderType`
- `scheduleFor`
- `tipAmount`

---

## Update Order

`PATCH /orders/:orderId`

Auth: manager access token required.

Updates an existing order. This endpoint supports changing:

- Delivery address (`addressId`)
- Payment method (`paymentMethod`)
- Payment provider (`paymentProvider`)
- Order type (`orderType` / `type`)
- Customer (`customerId`)
- Status-related dates (`paidAt`, `deliveredAt`)
- Cancel state (`canceled`)
- Line items (`orderProducts`: create/update/remove)

At least one valid field must be present in the request body.

### Request Body (All Optional)

```ts
type UpdateOrderRequest = {
  paidAt?: string | null; // ISO datetime
  deliveredAt?: string | null; // ISO datetime
  paymentMethod?: "CASH" | "CARD" | "ZELLE";
  paymentProvider?: "STRIPE" | null;
  canceled?: boolean;
  orderType?: "DELIVERY" | "TAKEAWAY"; // alias: type
  type?: "DELIVERY" | "TAKEAWAY";
  customerId?: string | null;
  addressId?: string | null;
  orderProducts?: OrderProductPatch[];
};

type OrderProductPatch =
  | {
      // Update existing line item
      id: string;
      quantity?: number;
      comments?: string | null;
      selectedModifierGroupItemIds?: string[];
      remove?: false;
    }
  | {
      // Remove existing line item
      id: string;
      remove: true;
    }
  | {
      // Create new line item
      productId: string;
      quantity?: number; // default: 1
      comments?: string | null;
      selectedModifierGroupItemIds?: string[];
    };
```

### Important Rules

- If final order type is `DELIVERY`, order must have an `addressId`.
- If order type is changed to `TAKEAWAY`, delivery address is cleared automatically.
- `customerId` and `addressId` are validated to ensure records exist.
- `orderProducts` updates will recalculate order subtotal (`amount`).

### Example: Update Address + Payment Method + Products

```json
{
  "addressId": "9cb035e1-fb47-47d0-83e3-db45fcc7d0b2",
  "paymentMethod": "CARD",
  "paymentProvider": "STRIPE",
  "orderProducts": [
    {
      "id": "existing-order-product-id",
      "quantity": 2
    },
    {
      "id": "existing-order-product-id-2",
      "remove": true
    },
    {
      "productId": "9fdef8c9-7a55-428e-b3d6-950d1ad49ac0",
      "quantity": 1,
      "selectedModifierGroupItemIds": [
        "3528e1a1-242c-4fa4-9b73-16ca4b94b40c"
      ]
    }
  ]
}
```

### Success (`200`)

Returns the full updated order payload (same shape used by order listing/get endpoints), including:

- `address`
- `customer`
- `orderProducts`
- `redeemedRewards`
- other order fields

### Errors

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
  payments: OrderPayment[];
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
    "payments": [
      {
        "amount": 1299,
        "paidAt": "2026-05-17T14:25:11.000Z",
        "paymentType": "CARD"
      }
    ],
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
