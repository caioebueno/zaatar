# Preparation Task API

Base URL (local): `http://localhost:4000`

Authentication: manager access token required on all routes.

## Preparation Task Stations (station task groups)

### `GET /preparation-task-stations`

Optional query params:
- `orderId`
- `stationId`
- `completed` (`true` | `false`)

### `GET /preparation-task-stations/:preparationTaskStationId`

Fetch one station task group.

### `POST /preparation-task-stations`

Creates a station task group.

Payload:

```json
{
  "id": "optional-uuid",
  "orderId": "required-order-id",
  "stationId": "required-station-id",
  "completed": false
}
```

### `PATCH /preparation-task-stations/:preparationTaskStationId`

Updates a station task group.

Payload (partial):

```json
{
  "stationId": "optional-station-id",
  "completed": true
}
```

If `completed=true`, all child tracks and modifier tracks are marked completed.

### `DELETE /preparation-task-stations/:preparationTaskStationId`

Deletes the group (cascades to tracks by DB relation).

## Tasks (PreparationStepTrack)

### `GET /preparation-tasks`

Optional query params:
- `orderId`
- `stationId`
- `preparationTaskStationId`
- `completed` (`true` | `false`)

### `GET /preparation-tasks/:taskId`

Fetch one task with nested modifier tracks.

### `POST /preparation-tasks`

Creates one task.

Payload:

```json
{
  "id": "optional-uuid",
  "preparationTaskStationId": "required-station-group-id",
  "preparationStepId": "required-step-id",
  "quantity": 1,
  "comments": "optional",
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

### `PATCH /preparation-tasks/:taskId`

Updates one task.

Payload (partial):

```json
{
  "quantity": 2,
  "comments": "no onions",
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

After create/update/delete task, station group `completed` is recomputed from child tracks.

## Response contract update

- `preparationTaskCategory` was renamed to `preparationTaskStation`.
- No menu category attachment is returned for these groups.
- Each group now carries:
  - `station`: `{ id, name }`
  - `completed`: `boolean`
  - `orderId`, `id`, `createdAt`

## Backward compatibility

- Old category routes remain accepted as aliases:
  - `/preparation-task-categories`
  - `/preparation-task-categories/:id`
- Old payload key `preparationStepCategoryId` is still accepted for task create/list filters, but `preparationTaskStationId` is the canonical key.
