# Entity: Order

## General Schema

```ts
type Order = {
  id: string;
  number: string | null;
  createdAt: string;
  orderType: "DELIVERY" | "TAKEAWAY" | string;
  paymentMethod: string;
  paymentProvider?: string | null;
  payments: Array<{
    amount: number; // cents
    paidAt: string | null; // ISO datetime
    paymentType: "CASH" | "CARD" | "ZELLE" | string;
  }>;
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

If no `OrderPayment` records exist yet, APIs return one derived payment using the legacy order fields: `amount`, `paidAt`, and `paymentMethod`.

## APIs

- `GET /orders`
- `GET /orders/:orderId`
- `POST /orders`
- `PATCH /orders/:orderId`
- `PATCH /drivers/orders/:orderId`
- `GET /orders-by-station?stationId=...`

## Detailed Docs

- [orders.md](../orders.md)
