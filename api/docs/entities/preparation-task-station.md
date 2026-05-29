# Entity: Preparation Task Station

## General Schema

```ts
type PreparationTaskStation = {
  id: string;
  orderId: string;
  stationId: string;
  completed: boolean;
  steps: Array<{
    id: string;
    completed: boolean;
    expectedAt?: string | null;
    completedAt?: string | null;
  }>;
};
```

## APIs

- `GET /preparation-task-stations`
- `POST /preparation-task-stations`
- `GET /preparation-task-stations/:id`
- `PATCH /preparation-task-stations/:id`
- `DELETE /preparation-task-stations/:id`
- `GET /preparation-tasks`
- `POST /preparation-tasks`
- `GET /preparation-tasks/:id`
- `PATCH /preparation-tasks/:id`
- `DELETE /preparation-tasks/:id`

## Detailed Docs

- [stations.md](../stations.md)
