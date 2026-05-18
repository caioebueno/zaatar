# Driver API (API Project)

Base: `api` service (default `http://localhost:4000`)

## Driver Auth (OTP)

### Send OTP

`POST /drivers/auth/otp/send`

Request body:

- `phone` (required string, full number with country code, digits only)
- `channel` (optional string: `WHATSAPP` or `SMS`; default `WHATSAPP`)
- `language` (optional string, e.g. `en`, `pt`, `es`)
- `sendAlsoSms` (optional boolean)
- `sendAlsoWhatsApp` (optional boolean)

Example:

```json
{
  "phone": "19297669288",
  "channel": "WHATSAPP",
  "language": "en",
  "sendAlsoSms": true
}
```

Success (`200`):

```json
{
  "ok": true,
  "expiresInMinutes": 10
}
```

### Verify OTP

`POST /drivers/auth/otp/verify`

Request body:

- `phone` (required string, full number with country code, digits only)
- `code` (required string, OTP code)

Example:

```json
{
  "phone": "19297669288",
  "code": "123456"
}
```

Success (`200`):

```json
{
  "ok": true,
  "accessToken": "<driver-access-token>",
  "expiresAt": "2026-08-11T16:32:10.000Z",
  "driver": {
    "id": "driver-id",
    "name": "Carlos",
    "phone": "19297669288",
    "active": true,
    "activatedAt": "2026-05-16T14:20:00.000Z",
    "deactivatedAt": null,
    "priorityLevel": 1
  }
}
```

Common errors:

- `400`: invalid payload (`field` returned)
- `400`: OTP expired or not found (`reason: OTP_NOT_FOUND_OR_EXPIRED`)
- `400`: OTP invalid (`reason: OTP_INVALID`, with `remainingAttempts`)
- `404`: driver not found

## Driver CRUD (Manager Auth)

Requires manager owner access token (`Authorization: Bearer <token>`):

- `POST /drivers`
- `GET /drivers`
- `GET /drivers/:driverId`
- `PATCH /drivers/:driverId`
- `PATCH /drivers/:driverId/activate`
- `PATCH /drivers/:driverId/deactivate`
- `DELETE /drivers/:driverId`

Driver payload fields include:

- `active` (current status)
- `activatedAt` (last time it became active)
- `deactivatedAt` (last time it became inactive)
- `activationEvents[]` (full history list with `status` = `ACTIVATED` or `DEACTIVATED` and `createdAt`)

Activation action routes:

- `PATCH /drivers/:driverId/activate`: sets `active = true`, updates `activatedAt`, appends `ACTIVATED` event
- `PATCH /drivers/:driverId/deactivate`: sets `active = false`, updates `deactivatedAt`, appends `DEACTIVATED` event

## Driver Dispatch Route Tracking (Driver Auth)

Requires driver access token (`Authorization: Bearer <driver-access-token>`):

- `PATCH /drivers/orders/:orderId` (set order `deliveredAt`)
- `PATCH /drivers/dispatches/:dispatchId/started-delivery`
- `POST /drivers/location`
- `POST /drivers/dispatches/:dispatchId/route/start`
- `POST /drivers/dispatches/:dispatchId/route/points/batch`
- `POST /drivers/dispatches/:dispatchId/route/stop`

Manager owner token can read route history by dispatch:

- `GET /dispatches/:dispatchId/route`
