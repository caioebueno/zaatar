# Entity: Feedback

## General Schema

```ts
type CustomerFeedback = {
  id: string;
  orderId: string;
  customerId?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
};
```

## APIs

- `GET /feedbacks`
- `GET /feedback`

## Detailed Docs

- [feedback.md](../feedback.md)
