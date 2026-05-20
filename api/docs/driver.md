# Driver API

Base URL (local): `http://localhost:4000`

---

## Driver Auth (OTP via WhatsApp/SMS)

### Send OTP

`POST /drivers/auth/otp/send`

No auth required.

Request body:

```json
{
  "phone": "19297669288",
  "channel": "WHATSAPP",
  "language": "en",
  "sendAlsoSms": true,
  "sendAlsoWhatsApp": false
}
```

- `phone`: required, digits with country code
- `channel`: optional, `WHATSAPP` (default) or `SMS`
- `language`: optional, e.g. `en`, `pt`, `es`
- `sendAlsoSms`: optional boolean
- `sendAlsoWhatsApp`: optional boolean

Success (`200`):

```json
{
  "ok": true,
  "expiresInMinutes": 10
}
```

### Verify OTP

`POST /drivers/auth/otp/verify`

No auth required.

Request body:

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

Errors:

- `400`: invalid payload (`field` returned)
- `400`: OTP expired or not found — `reason: OTP_NOT_FOUND_OR_EXPIRED`
- `400`: OTP invalid — `reason: OTP_INVALID` (includes `remainingAttempts`)
- `404`: driver not found

---

## Driver CRUD (Manager Auth)

All routes require manager access token (`Authorization: Bearer <manager-access-token>`).

### Create Driver

`POST /drivers`

Request body:

```json
{
  "name": "Carlos",
  "phone": "19297669288"
}
```

### List Drivers

`GET /drivers`

Returns all drivers for the active business.

### Get Driver

`GET /drivers/:driverId`

### Update Driver

`PATCH /drivers/:driverId`

Request body (partial):

```json
{
  "name": "Carlos Updated",
  "phone": "19297669289"
}
```

### Activate Driver

`PATCH /drivers/:driverId/activate`

Sets `active = true`, updates `activatedAt`, appends an `ACTIVATED` event to `activationEvents`.

### Deactivate Driver

`PATCH /drivers/:driverId/deactivate`

Sets `active = false`, updates `deactivatedAt`, appends a `DEACTIVATED` event to `activationEvents`.

### Delete Driver

`DELETE /drivers/:driverId`

Driver payload fields:

```ts
type DriverPayload = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  activatedAt: string | null; // ISO datetime
  deactivatedAt: string | null; // ISO datetime
  priorityLevel: number;
  activationEvents: Array<{
    status: "ACTIVATED" | "DEACTIVATED";
    createdAt: string; // ISO datetime
  }>;
};
```

---

## Driver Self-Management (Driver Auth)

These routes use a driver access token.

### Activate Self

`PATCH /drivers/me/activate`

Driver activates themselves. Same effect as manager activation.

### Deactivate Self

`PATCH /drivers/me/deactivate`

Driver deactivates themselves.

---

## Notes

- Driver dispatch and route tracking routes are documented in [dispatch.md](./dispatch.md) and [dispatch-route.md](./dispatch-route.md).
- Order update for drivers is documented in [orders.md](./orders.md).
