# Dispatch Route Tracking API (API Project)

Base URL (local): `http://localhost:4000`

This module stores GPS route history for a driver during a dispatch.

## 0) Ingest Driver Location (Driver Auth, token + location only)

Endpoint:

`POST /drivers/location`

Authentication:

- Driver access token required:
  - `Authorization: Bearer <driver-access-token>`

Request body (single location point):

```json
{
  "lat": 27.9506,
  "lng": -82.4572,
  "recordedAt": "2026-05-15T14:21:02.000Z",
  "accuracyMeters": 5,
  "speedMps": 10.4,
  "headingDegrees": 210,
  "altitudeMeters": 3.2,
  "source": "GPS",
  "isMocked": false
}
```

Behavior:

- API resolves the active dispatch from token driver id.
- Active dispatch is defined as `Dispatch.startedDeliveryAt IS NOT NULL` and not yet marked with `ARRIVED_RESTAURANT`.
- If no active route session exists for that dispatch+driver, API creates one automatically.
- Inserts this location as one route point and enqueues ETA recalculation.
- Tracks route milestone `LEFT_PIZZERIA` once per dispatch when geofence exit is detected.

Success (`200`):

```json
{
  "ok": true,
  "dispatchId": "dispatch-id",
  "sessionId": "route-session-id",
  "insertedCount": 1,
  "lastSequence": 18,
  "leftPizzeriaTracked": false,
  "leftAtDropOffTracked": false,
  "arrivedAtRestaurantTracked": false
}
```

`leftPizzeriaTracked`:

- `true`: this call recorded the `LEFT_PIZZERIA` milestone.
- `false`: not tracked in this call (already tracked, not enough signal, or no branch coordinates available).

`leftAtDropOffTracked`:

- `true`: this call recorded the `LEFT_DROPOFF` milestone for one specific order in the dispatch.
- `false`: not tracked in this call.

`arrivedAtRestaurantTracked`:

- `true`: this call recorded the `ARRIVED_RESTAURANT` milestone for this dispatch.
- `false`: not tracked in this call.

Order-level persistence:

- `LEFT_PIZZERIA` updates `Dispatch.leftRestaurantAt/Lat/Lng`.
- `LEFT_DROPOFF` updates that order's `Order.leftAtDropOffAt/Lat/Lng`.
- `ARRIVED_RESTAURANT` updates `Dispatch.arrivedAtRestaurantAt/Lat/Lng`.
- When `ARRIVED_RESTAURANT` is tracked, the active route session is completed automatically and subsequent location ingests for that dispatch are ignored.

Geofence detection rules:

- Origin: first branch address (`Branch -> Address.lat/lng`) found for orders in the dispatch.
- Ignores mocked points (`isMocked = true`) and very inaccurate points (`accuracyMeters > 100`, configurable).
- `LEFT_PIZZERIA`: tracked when latest valid point is outside configured radius from restaurant origin.
- `ARRIVED_RESTAURANT`: tracked when latest valid point is inside configured radius from restaurant origin.

Optional environment flags:

- `DISPATCH_LEFT_PIZZERIA_OUTSIDE_RADIUS_METERS` (default `120`)
- `DISPATCH_LEFT_DROPOFF_INSIDE_RADIUS_METERS` (default `60`)
- `DISPATCH_LEFT_DROPOFF_OUTSIDE_RADIUS_METERS` (default `100`)
- `DISPATCH_LEFT_DROPOFF_STREAK_POINTS` (default `3`)
- `DISPATCH_LEFT_PIZZERIA_MIN_SPEED_MPS` (default `1.5`, used as minimum movement speed for streak-based left drop-off detection)
- `DISPATCH_ARRIVED_RESTAURANT_RADIUS_METERS` (default `70`)
- `DISPATCH_LOCATION_MAX_ACCURACY_METERS` (default `100`)

## 1) Start Route Session (Driver Auth)

Endpoint:

`POST /drivers/dispatches/:dispatchId/route/start`

Authentication:

- Driver access token required:
  - `Authorization: Bearer <driver-access-token>`

Request body:

```json
{}
```

Notes:

- Route session `startedAt` is internal-only and is not exposed in this API.
- Use `Dispatch.startedDeliveryAt` (from dispatch APIs) as the delivery start timestamp.

Success:

- `201` when a new active session is created
- `200` when an active session already exists (idempotent behavior)

```json
{
  "created": true,
  "session": {
    "id": "route-session-id",
    "dispatchId": "dispatch-id",
    "driverId": "driver-id",
    "status": "ACTIVE",
    "createdAt": "2026-05-15T14:20:00.000Z",
    "updatedAt": "2026-05-15T14:20:00.000Z",
    "endedAt": null,
    "totalDistanceMeters": null,
    "durationSeconds": null,
    "polyline": null
  }
}
```

## 2) Insert Route Points Batch (Driver Auth)

Endpoint:

`POST /drivers/dispatches/:dispatchId/route/points/batch`

Request body:

```json
{
  "points": [
    {
      "lat": 27.9506,
      "lng": -82.4572,
      "recordedAt": "2026-05-15T14:21:02.000Z",
      "accuracyMeters": 5,
      "speedMps": 10.4,
      "headingDegrees": 210,
      "altitudeMeters": 3.2,
      "source": "GPS",
      "isMocked": false
    }
  ]
}
```

Notes:

- `points` required, 1 to 500 items
- `recordedAt` optional (defaults to server now)
- `source` optional (`GPS` default), accepted: `GPS`, `NETWORK`, `MANUAL`
- `sessionId` is not required; API resolves active route session automatically.
- If driver has no active delivery dispatch/session for this `dispatchId`, request is ignored.
- Every successful batch enqueue triggers a `DispatchEtaRecalculationJob` for this dispatch.
- ETA calculation runs asynchronously in `queue-worker`.

Success (`200`):

```json
{
  "ok": true,
  "ignored": false,
  "sessionId": "route-session-id",
  "insertedCount": 1,
  "lastSequence": 8
}
```

Ignored success (`200`):

```json
{
  "ok": true,
  "ignored": true,
  "sessionId": null,
  "insertedCount": 0,
  "lastSequence": 0
}
```

### ETA side effects (async)

Each ETA recalculation job updates:

- `Dispatch.currentEstimatedDeliveryDurationMinutes`
- `Dispatch.currentEstimatedRoundTripDurationMinutes`
- `Order.currentEstimatedDeliveryDurationMinutes` for pending (not delivered/canceled) orders in the dispatch

Notes:

- `estimatedDeliveryDurationMinutes` / `estimatedRoundTripDurationMinutes` remain the planned baseline ETA.
- `currentEstimated*` fields represent live ETA recalculated from latest driver location.

## 3) Stop Route Session (Driver Auth)

Endpoint:

`POST /drivers/dispatches/:dispatchId/route/stop`

Request body:

```json
{
  "sessionId": "route-session-id",
  "endedAt": "2026-05-15T14:42:00.000Z"
}
```

- `endedAt` optional (defaults to server now)

Success (`200`):

```json
{
  "ok": true,
  "pointsCount": 42,
  "session": {
    "id": "route-session-id",
    "dispatchId": "dispatch-id",
    "driverId": "driver-id",
    "status": "COMPLETED",
    "createdAt": "2026-05-15T14:20:00.000Z",
    "updatedAt": "2026-05-15T14:42:01.000Z",
    "endedAt": "2026-05-15T14:42:00.000Z",
    "totalDistanceMeters": 13540,
    "durationSeconds": 1320,
    "polyline": null
  }
}
```

## 4) Get Dispatch Route (Manager Owner Auth)

Endpoint:

`GET /dispatches/:dispatchId/route`

Authentication:

- Manager owner access token required:
  - `Authorization: Bearer <manager-access-token>`

Success (`200`):

```json
{
  "dispatchId": "dispatch-id",
  "sessions": [
    {
      "id": "route-session-id",
      "dispatchId": "dispatch-id",
      "driverId": "driver-id",
      "status": "COMPLETED",
      "createdAt": "2026-05-15T14:20:00.000Z",
      "updatedAt": "2026-05-15T14:42:01.000Z",
      "endedAt": "2026-05-15T14:42:00.000Z",
      "totalDistanceMeters": 13540,
      "durationSeconds": 1320,
      "polyline": null,
      "points": [
        {
          "id": "point-id",
          "sessionId": "route-session-id",
          "sequence": 1,
          "createdAt": "2026-05-15T14:21:02.000Z",
          "recordedAt": "2026-05-15T14:21:02.000Z",
          "lat": 27.9506,
          "lng": -82.4572,
          "accuracyMeters": 5,
          "speedMps": 10.4,
          "headingDegrees": 210,
          "altitudeMeters": 3.2,
          "source": "GPS",
          "isMocked": false
        }
      ]
    }
  ]
}
```

## Error Responses

`400` invalid payload:

```json
{
  "error": "Invalid payload",
  "field": "points[0].lat"
}
```

`401` unauthorized:

```json
{
  "error": "Unauthorized"
}
```

`403` dispatch access denied for driver:

```json
{
  "error": "Forbidden",
  "reason": "DRIVER_DISPATCH_ACCESS_DENIED"
}
```

`404` no active dispatch for authenticated driver:

```json
{
  "error": "No active dispatch for driver",
  "reason": "ACTIVE_DISPATCH_NOT_FOUND"
}
```

`404` route session not found:

```json
{
  "error": "Dispatch route session not found"
}
```

`409` session already closed:

```json
{
  "error": "Dispatch route session closed",
  "reason": "SESSION_ALREADY_CLOSED"
}
```
