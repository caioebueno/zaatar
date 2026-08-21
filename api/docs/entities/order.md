# Entity: Order

## General Schema

```ts
type Order = {
  id: string;
  number: string | null;
  externalId?: string | null;
  createdAt: string;
  scheduleFor?: string | null;
  language?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  orderType: "DELIVERY" | "TAKEAWAY" | string;
  paymentMethod: string;
  paymentProvider?: string | null;
  payments: Array<{
    amount: number; // cents
    paidAt: string | null; // ISO datetime
    paymentType: "CASH" | "CARD" | "ZELLE" | string;
    paymentProvider: "STRIPE" | null;
    externalId: string | null;
  }>;
  status: string;
  canceled: boolean;
  customer: { name: string | null; phone: string | null };
  deliveryAddressId?: string | null;
  deliveryAddress?: {
    id: string;
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
    deliveryFee?: number;
    expectedHandoffDuration?: number;
  } | null;
  dispatchId?: string | null;
  branchId?: string | null;
  tags: string[];
  progressiveDiscountSnapshot?: unknown;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitAmountCents: number;
    lineTotalCents: number;
    comments?: string;
    modifierGroupItems: Array<{
      id: string;
      name: string;
      price: number;
      description?: string;
    }>;
  }>;
  subtotalCents: number;
  discountedSubtotalCents: number;
  tipPercent: number;
  tipAmountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};
```

If no `OrderPayment` records exist yet, APIs return one derived payment using the legacy order fields: `amount`, `paidAt`, and `paymentMethod`.

## APIs

- `GET /orders`
- `GET /v1/order`
- `GET /orders/:orderId`
- `POST /orders`
- `PATCH /orders/:orderId`
- `PATCH /drivers/orders/:orderId`
- `GET /orders-by-station?stationId=...`

## Detailed Docs

- [orders.md](../orders.md)
