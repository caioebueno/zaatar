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
- `DELETE /drivers/:driverId`
