# Owner Auth API (API Project)

Base URL (local): `http://localhost:4000`

## Existing Email/Password Auth

- `POST /owners/register`
- `POST /owners/login`

Register now requires `phone` in payload (digits with country code, e.g. `19297669288`).

## OTP Auth (Email)

### Send OTP

`POST /owners/auth/otp/send`

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
  "expiresAt": "2026-08-13T18:30:00.000Z",
  "owner": {
    "id": "owner-id",
    "email": "owner@example.com",
    "name": "Owner Name",
    "phone": "19297669288"
  },
  "selectedBusinessId": "business-id-or-null",
  "businesses": [
    {
      "id": "business-id",
      "name": "Business Name"
    }
  ]
}
```

Common errors:

- `400`: invalid payload (`field` returned)
- `400`: OTP expired or not found (`reason: OTP_NOT_FOUND_OR_EXPIRED`)
- `400`: OTP invalid (`reason: OTP_INVALID`, with `remainingAttempts`)
- `404`: owner not found

## Notes

- OTP sender uses Twilio Verify SMS (`TwilioOwnerOtpSender`).
- Env:
  - `OWNER_OTP_TTL_MINUTES` (optional, default `10`)
  - `OWNER_OTP_SECRET` (optional)
  - `TWILIO_ACCOUNT_SID` (required)
  - `TWILIO_AUTH_TOKEN` (required)
  - `TWILIO_VERIFY_SERVICE_SID` (required)
  - `TWILIO_VERIFY_API_BASE_URL` (optional)
