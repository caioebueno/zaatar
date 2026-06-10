# Entity: Dispatch

## General Schema

```ts
type Dispatch = {
  id: string;
  status: "READY_FOR_DELIVERY" | "OUT_FOR_DELIVERY" | "DELIVERED" | string;
  completedAt?: string | null;
  queueIndex?: number | null;
  driverId?: string | null;
  startedDeliveryAt?: string | null;
  leftRestaurantAt?: string | null;
  arrivedAtRestaurantAt?: string | null;
  expectedEtaAt?: string | null;
  currentEtaAt?: string | null;
  orders: Order[];
};
```

## APIs

- `GET /dispatches`
- `PATCH /dispatches/:dispatchId`
- `PATCH /dispatches/orders/:orderId`
- `GET /dispatches/next` (driver auth)
- `GET /drivers/dispatches` (driver auth)
- `PATCH /drivers/dispatches/:dispatchId/started-delivery` (driver auth)
- `GET /dispatches/:dispatchId/route`

## Detailed Docs

- [dispatch.md](../dispatch.md)
- [dispatch-route.md](../dispatch-route.md)
