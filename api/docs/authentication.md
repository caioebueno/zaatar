# Authentication

## Manager (Owner) Auth

Protected routes require a manager access token issued by:

- `POST /owners/login` (email/password)
- `POST /owners/auth/otp/verify` (OTP via SMS)

The token can be supplied as:

- `Authorization: Bearer <manager-access-token>` header
- `manager_access_token` cookie

### Business context resolution

Manager routes resolve a business context for the authenticated user. The API checks in this order:

1. `x-business-id` request header
2. `businessId` query param
3. `manager_business_id` cookie
4. First owned business (default fallback)

If the requested `businessId` does not belong to the authenticated user, the API returns `403 Forbidden` with `reason: BUSINESS_ACCESS_DENIED`.

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MANAGER_ACCESS_TOKEN_SECRET` | Yes (prod) | — | HMAC secret for signing tokens |
| `MANAGER_ACCESS_TOKEN_TTL_DAYS` | No | `90` | Token expiration in days |

---

## Driver Auth

Driver-protected routes require a driver access token issued by `POST /drivers/auth/otp/verify`.

Supply it as:

- `Authorization: Bearer <driver-access-token>` header

Driver tokens carry `driverId`, `name`, and `phone`. The API uses these to enforce per-driver data access (e.g. a driver can only update dispatches assigned to them).

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DRIVER_ACCESS_TOKEN_SECRET` | Yes (prod) | — | HMAC secret for driver tokens |
| `DRIVER_ACCESS_TOKEN_TTL_DAYS` | No | `90` | Token expiration in days |

---

## Public Routes

No auth required:

- `GET /health`
- `GET /public/order-link/settings`
- `POST /owners/auth/otp/send`
- `POST /owners/auth/otp/verify`
- `POST /owners/login`
- `POST /owners/register`
- `POST /owners`
- `POST /drivers/auth/otp/send`
- `POST /drivers/auth/otp/verify`

---

## Common Auth Error Responses

`401 Unauthorized`:

```json
{ "error": "Unauthorized" }
```

`403 Forbidden` (business access denied):

```json
{ "error": "Forbidden", "reason": "BUSINESS_ACCESS_DENIED" }
```

`403 Forbidden` (driver dispatch access denied):

```json
{ "error": "Forbidden", "reason": "DRIVER_DISPATCH_ACCESS_DENIED" }
```
