# Station API (API Project)

Base URL (local): `http://localhost:4000`

## Route: List Stations

`GET /stations`

### Purpose

Returns station list for the authenticated owner context, including preparation steps per station.

### Authentication

- Required: manager owner access token
- Header:
  - `Authorization: Bearer <manager-access-token>`

### Business context

- The route requires a valid business context for the authenticated owner.
- Business selection can come from standard API context resolution (`x-business-id`, query, or default owned business).

### Request

No request body.

Optional headers:

- `x-business-id: <business-id>` (when owner has multiple businesses and wants explicit selection)

### Success response (`200`)

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

### Response schema

```ts
type ListStationsResponse = {
  items: Array<{
    id: string;
    name: string;
    preparationSteps: Array<{
      id: string;
      name: string;
      goalMinutes: number; // target minutes from order createdAt
      includeComments: boolean;
      includeModifiers: boolean;
    }>;
  }>;
};
```

## Route: Create Step

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

Notes:

- `goalMinutes` is optional and must be an integer `>= 0`.
- If omitted, defaults to `0`.
- `goalMinutes` is treated as a station-level SLA target. When sent, the value is synchronized across all steps in that station so all station tasks share the same target.

## Route: Update Step

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

Notes:

- If `goalMinutes` is provided, the API synchronizes that value to all steps in the same station.

## Route: Complete All Station Tasks For Order

`POST /stations/:stationId/orders/:orderId/complete`

### Purpose

- Completes all `PreparationStepTrack` rows for the given station and order.
- Also completes related modifier tracks.
- Recomputes category completion for any affected `PreparationStepCategory`.

### Success response (`200`)

```json
{
  "orderId": "order-id",
  "stationId": "station-id",
  "completedTracks": 8,
  "totalTracks": 8,
  "stationCompleted": true
}
```

### Errors

Business context missing (`400`):

```json
{
  "error": "Invalid payload",
  "field": "businessId",
  "reason": "BUSINESS_CONTEXT_REQUIRED"
}
```

Unauthorized (`401`):

```json
{
  "error": "Unauthorized"
}
```

Forbidden business access (`403`):

```json
{
  "error": "Forbidden",
  "reason": "BUSINESS_ACCESS_DENIED"
}
```
