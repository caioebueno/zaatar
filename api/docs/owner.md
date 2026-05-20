# Owner API

Base URL (local): `http://localhost:4000`

## Register Owner

`POST /owners` or `POST /owners/register`

No auth required.

Request body:

```json
{
  "name": "Owner Name",
  "email": "owner@example.com",
  "password": "password123",
  "phone": "19297669288"
}
```

- `phone`: required, digits only with country code (e.g. `19297669288`)

Responses:

- `201`: owner created
- `400`: invalid payload / invalid JSON
- `409`: email already registered

---

## Login (Email/Password)

`POST /owners/login`

No auth required.

Request body:

```json
{
  "email": "owner@example.com",
  "password": "password123"
}
```

Success (`200`):

```json
{
  "accessToken": "<manager-access-token>",
  "expiresAt": "2026-08-19T00:00:00.000Z"
}
```

Errors:

- `400`: invalid payload / invalid JSON
- `401`: invalid credentials

---

## OTP Auth (SMS)

### Send OTP

`POST /owners/auth/otp/send`

No auth required.

Request body:

```json
{
  "phone": "19297669288",
  "language": "en"
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

`POST /owners/auth/otp/verify`

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
  "accessToken": "<owner-access-token>",
  "expiresAt": "2026-08-19T00:00:00.000Z",
  "owner": {
    "id": "owner-id",
    "email": "owner@example.com",
    "name": "Owner Name",
    "phone": "19297669288"
  },
  "selectedBusinessId": "business-id-or-null",
  "businesses": [
    { "id": "business-id", "name": "Business Name" }
  ]
}
```

Errors:

- `400`: invalid payload (`field` returned)
- `400`: OTP expired or not found — `reason: OTP_NOT_FOUND_OR_EXPIRED`
- `400`: OTP invalid — `reason: OTP_INVALID` (includes `remainingAttempts`)
- `404`: owner not found

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token |
| `TWILIO_VERIFY_SERVICE_SID` | Yes | Twilio Verify service SID |
| `TWILIO_VERIFY_API_BASE_URL` | No | Override Twilio API base URL |
| `OWNER_OTP_TTL_MINUTES` | No | OTP validity (default `10`) |
| `OWNER_OTP_SECRET` | No | Optional OTP signing secret |
