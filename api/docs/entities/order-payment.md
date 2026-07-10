# Entity: OrderPayment

## General Schema

```ts
type OrderPayment = {
  id: string;
  createdAt: string;          // ISO datetime
  orderId: string;
  amount: number;             // in cents
  paymentType: "CASH" | "CARD" | "ZELLE";
  paymentProvider: "STRIPE" | null;
  externalId: string | null;  // e.g. Stripe PaymentIntent ID
  paidAt: string | null;      // ISO datetime; null if pending
};
```

An order may have more than one `OrderPayment` (split-payment scenarios). Sum `amount` across all entries for the total charged.

## APIs

- `GET /orders/:orderId/payments` — list all payments for an order
- `POST /orders/:orderId/payments` — create a payment (requires `amount`, `paymentType`)
- `PATCH /payments/:paymentId` — update a payment
- `DELETE /payments/:paymentId` — delete a payment

All routes require manager auth.

### POST /orders/:orderId/payments

Request body:

```ts
{
  amount: number;                          // cents, required
  paymentType: "CASH" | "CARD" | "ZELLE"; // required
  paymentProvider?: "STRIPE" | null;
  externalId?: string | null;
  paidAt?: string | null;                  // ISO datetime
}
```

### PATCH /payments/:paymentId

Any subset of the mutable fields:

```ts
{
  amount?: number;
  paymentType?: "CASH" | "CARD" | "ZELLE";
  paymentProvider?: "STRIPE" | null;
  externalId?: string | null;
  paidAt?: string | null;
}
```

At least one field required; returns `400` if body is empty.

## Detailed Docs

- [dispatch.md — OrderPayment Entity](../dispatch.md#orderpayment-entity)
