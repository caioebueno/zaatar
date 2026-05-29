# Entity: Station

## General Schema

```ts
type Station = {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    name: string;
    goalMinutes?: number;
  }>;
};
```

## APIs

- `GET /stations`
- `POST /stations`
- `PATCH /stations/:stationId`
- `DELETE /stations/:stationId`
- `POST /stations/:stationId/steps`
- `PATCH /stations/:stationId/steps/:stepId`
- `DELETE /stations/:stationId/steps/:stepId`
- `POST /stations/:stationId/orders/:orderId/complete`

## Detailed Docs

- [stations.md](../stations.md)
