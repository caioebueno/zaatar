# Dispatch Route Tracking API

Base URL (local): `http://localhost:4000`

Stores GPS route history for a driver during a dispatch. ETA recalculation is triggered asynchronously after each batch insert.

---

## 1. Ingest Driver Location

`POST /drivers/location`

Auth: driver access token required.

Ingests a single GPS point. The API resolves the active dispatch from the driver token. An active dispatch is one where `Dispatch.startedDeliveryAt IS NOT NULL`. If no route session exists for that dispatch+driver, one is created automatically.

Request body:

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

Success (`200`):

```json
{
  "ok": true,
  "dispatchId": "dispatch-id",
  "sessionId": "route-session-id",
  "insertedCount": 1,
  "lastSequence": 18
}
```

---

## 2. Start Route Session

`POST /drivers/dispatches/:dispatchId/route/start`

Auth: driver access token required.

Idempotent — returns `200` if a session already exists, `201` if a new one is created.

Request body: `{}`

Success:

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

Note: route session `startedAt` is internal. Use `Dispatch.startedDeliveryAt` as the canonical delivery start timestamp.

---

## 3. Insert Route Points Batch

`POST /drivers/dispatches/:dispatchId/route/points/batch`

Auth: driver access token required.

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

- `points`: required, 1–500 items
- `recordedAt`: optional (defaults to server time)
- `source`: optional, accepted values: `GPS`, `NETWORK`, `MANUAL` (default `GPS`)
- `sessionId`: not required — resolved automatically from active dispatch session

If the driver has no active delivery dispatch/session for this `dispatchId`, the request is silently ignored.

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

Ignored (no active session) (`200`):

```json
{
  "ok": true,
  "ignored": true,
  "sessionId": null,
  "insertedCount": 0,
  "lastSequence": 0
}
```

### ETA Side Effects (async)

Each successful batch enqueues a `DispatchEtaRecalculationJob` which updates:

- `Dispatch.estimatedDeliveryDurationMinutes`
- `Dispatch.estimatedRoundTripDurationMinutes`
- `Order.estimatedDeliveryDurationMinutes` for each pending order in the dispatch

---

## 4. Stop Route Session

`POST /drivers/dispatches/:dispatchId/route/stop`

Auth: driver access token required.

Request body:

```json
{
  "sessionId": "route-session-id",
  "endedAt": "2026-05-15T14:42:00.000Z"
}
```

- `endedAt`: optional (defaults to server time)

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

---

## 5. Get Dispatch Route (Manager)

`GET /dispatches/:dispatchId/route`

Auth: manager access token required.

Returns all route sessions and points for a given dispatch.

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

---

## Error Responses

| Status | Body | Reason |
|---|---|---|
| `400` | `{ "error": "Invalid payload", "field": "points[0].lat" }` | Invalid point data |
| `401` | `{ "error": "Unauthorized" }` | Missing/invalid token |
| `403` | `{ "error": "Forbidden", "reason": "DRIVER_DISPATCH_ACCESS_DENIED" }` | Driver not assigned to dispatch |
| `404` | `{ "error": "No active dispatch for driver", "reason": "ACTIVE_DISPATCH_NOT_FOUND" }` | No active dispatch |
| `404` | `{ "error": "Dispatch route session not found" }` | Session not found |
| `409` | `{ "error": "Dispatch route session closed", "reason": "SESSION_ALREADY_CLOSED" }` | Session already stopped |
