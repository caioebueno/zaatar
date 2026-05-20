# Stations & Preparation Tasks API

Base URL (local): `http://localhost:4000`

Auth: manager access token required on all routes.

---

## Stations

A station (e.g. "Kitchen", "Grill") groups preparation steps and tracks task completion per order.

### List Stations

`GET /stations`

Returns stations with their preparation steps for the active business.

Success (`200`):

```json
{
  "items": [
    {
      "id": "station-id",
      "name": "Kitchen",
      "preparationSteps": [
        {
          "id": "step-id",
          "name": "Prepare",
          "goalMinutes": 12,
          "includeComments": true,
          "includeModifiers": true
        }
      ]
    }
  ]
}
```

### Create Station

`POST /stations`

Request body:

```json
{
  "name": "Grill"
}
```

### Update Station

`PATCH /stations/:stationId`

Request body (partial):

```json
{
  "name": "Updated Name"
}
```

### Delete Station

`DELETE /stations/:stationId`

---

## Preparation Steps

Steps belong to a station and define the tasks to track per order.

### Create Step

`POST /stations/:stationId/steps`

Request body:

```json
{
  "name": "Cook",
  "goalMinutes": 15,
  "includeComments": true,
  "includeModifiers": false
}
```

- `goalMinutes`: optional integer `>= 0`, default `0`. When set, the value is synchronized across all steps in the same station (station-level SLA).

### Update Step

`PATCH /stations/:stationId/steps/:stepId`

Request body (partial):

```json
{
  "name": "Cook",
  "goalMinutes": 18,
  "includeComments": true,
  "includeModifiers": true
}
```

- `goalMinutes`: if provided, synchronized to all steps in the station.

### Delete Step

`DELETE /stations/:stationId/steps/:stepId`

---

## Complete All Station Tasks For Order

`POST /stations/:stationId/orders/:orderId/complete`

Marks all `PreparationStepTrack` rows for this station+order as completed, including modifier tracks. Recomputes station group completion.

Success (`200`):

```json
{
  "orderId": "order-id",
  "stationId": "station-id",
  "completedTracks": 8,
  "totalTracks": 8,
  "stationCompleted": true
}
```

---

## Preparation Task Stations (Station Task Groups)

A station task group (`PreparationTaskStation`) links a station to an order and tracks the group-level completion.

### List Station Task Groups

`GET /preparation-task-stations`

Optional query params:

- `orderId`
- `stationId`
- `completed` (`true` | `false`)

### Get Station Task Group

`GET /preparation-task-stations/:preparationTaskStationId`

### Create Station Task Group

`POST /preparation-task-stations`

Request body:

```json
{
  "id": "optional-uuid",
  "orderId": "required-order-id",
  "stationId": "required-station-id",
  "completed": false
}
```

### Update Station Task Group

`PATCH /preparation-task-stations/:preparationTaskStationId`

Request body (partial):

```json
{
  "stationId": "new-station-id",
  "completed": true
}
```

If `completed = true`, all child tasks and modifier tracks are marked completed automatically.

### Delete Station Task Group

`DELETE /preparation-task-stations/:preparationTaskStationId`

Cascades to child tasks via DB relation.

---

## Backward Compatibility

Old `/preparation-task-categories` routes are accepted as aliases:

- `GET /preparation-task-categories`
- `GET /preparation-task-categories/:id`
- `POST /preparation-task-categories`
- `PATCH /preparation-task-categories/:id`
- `DELETE /preparation-task-categories/:id`

Old payload key `preparationStepCategoryId` is still accepted in task create/list filters, but `preparationTaskStationId` is the canonical key.

---

## Preparation Tasks

A preparation task (`PreparationStepTrack`) is a single trackable step within a station task group.

### List Tasks

`GET /preparation-tasks`

Optional query params:

- `orderId`
- `stationId`
- `preparationTaskStationId`
- `completed` (`true` | `false`)

### Get Task

`GET /preparation-tasks/:taskId`

Returns the task with nested modifier tracks.

### Create Task

`POST /preparation-tasks`

Request body:

```json
{
  "id": "optional-uuid",
  "preparationTaskStationId": "required-station-group-id",
  "preparationStepId": "required-step-id",
  "quantity": 1,
  "comments": "no onions",
  "completed": false,
  "completedComments": false,
  "goalMinutes": 12,
  "expectedAt": "2026-05-17T18:20:00.000Z",
  "modifiers": [
    {
      "id": "modifier-track-id",
      "modifierGroupItemId": "modifier-item-id",
      "completed": false
    }
  ]
}
```

### Update Task

`PATCH /preparation-tasks/:taskId`

Request body (partial):

```json
{
  "quantity": 2,
  "comments": "extra spicy",
  "completed": true,
  "completedComments": true,
  "goalMinutes": 10,
  "expectedAt": "2026-05-17T18:30:00.000Z",
  "modifiers": [
    {
      "id": "modifier-track-id",
      "modifierGroupItemId": "modifier-item-id",
      "completed": true
    }
  ]
}
```

After any create/update/delete, the parent station group `completed` field is recomputed from child tasks.

### Delete Task

`DELETE /preparation-tasks/:taskId`

---

## Response Shape Notes

Each station task group returns:

```ts
type StationTaskGroup = {
  id: string;
  createdAt: string; // ISO datetime
  orderId: string;
  completed: boolean;
  station: { id: string; name: string };
  // child tasks embedded when fetched via GET
};
```

- `preparationTaskCategory` was renamed to `preparationTaskStation` in the response contract.
- No menu category is embedded in these groups.
