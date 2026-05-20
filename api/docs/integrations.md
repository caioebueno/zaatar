# Integrations API

Base URL (local): `http://localhost:4000`

Auth: manager access token required on all routes.

---

## Stripe Connect

Handles Stripe Connect onboarding for payment processing.

### Create Onboarding Link

`POST /integrations/stripe/connect/onboarding-link`

Generates a Stripe Connect onboarding link for the active business.

Request body:

```json
{
  "refreshUrl": "https://your-app.com/onboarding/refresh",
  "returnUrl": "https://your-app.com/onboarding/return"
}
```

Success (`200`): returns the Stripe onboarding link URL.

Errors:

- `400`: missing business context
- `400`: Stripe not configured (`STRIPE_SECRET_KEY` missing)
- `502`: Stripe request failed

### Get Connect Status

`GET /integrations/stripe/connect/status`

Returns the Stripe Connect status for the active business.

Success (`200`): returns Stripe Connect status object.

### Update Banking Profile

`POST /integrations/stripe/connect/banking-profile`

Updates Stripe banking profile details.

---

## Environment Variables (Stripe)

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes (for Stripe routes) | Stripe secret key |
| `ORDER_LINK_BASE_URL` | No | Base URL used in onboarding order link |

---

## Uber Eats

Handles Uber Eats OAuth connection and menu sync.

### Get Connection Status

`GET /integrations/uber-eats/connection`

Returns the current Uber Eats connection state (connected/disconnected, token status).

### Get Stores

`GET /integrations/uber-eats/stores`

Returns the list of Uber Eats stores associated with the connected account.

### Get Menu Sync Status

`GET /integrations/uber-eats/menu-sync/status`

Returns the current menu sync status.

### Get Menu Sync History

`GET /integrations/uber-eats/menu-sync/history`

Returns the history of past menu syncs.

### Preview Menu Sync

`GET /integrations/uber-eats/menu-sync/preview`

Returns a preview of what will be synced to Uber Eats.

### Get OAuth URL

`GET /integrations/uber-eats/oauth/url`

Returns the Uber Eats OAuth authorization URL to initiate the OAuth flow.

### Exchange OAuth Code

`POST /integrations/uber-eats/oauth/exchange`

Request body:

```json
{
  "code": "uber-oauth-code",
  "redirectUri": "https://your-app.com/integrations/uber-eats/callback"
}
```

Exchanges the OAuth authorization code for an access token and saves the connection.

### Publish Menu

`POST /integrations/uber-eats/menu-sync/publish`

Triggers a menu sync publish to Uber Eats.

---

## Environment Variables (Uber Eats)

| Variable | Required | Default | Description |
|---|---|---|---|
| `UBER_EATS_OAUTH_BASE_URL` | No | `https://sandbox-login.uber.com` | Uber OAuth base URL |
| `UBER_EATS_API_BASE_URL` | No | `https://api.uber.com` | Uber API base URL |
| `UBER_EATS_OAUTH_SCOPES` | No | `eats.pos_provisioning` | OAuth scopes |
| `UBER_EATS_OAUTH_PROMPT` | No | `login` | OAuth prompt type (`login` or `consent`) |
| `UBER_EATS_REDIRECT_URI` | No | — | Default redirect URI for OAuth |

---

## Public Business Settings

`GET /public/order-link/settings`

No auth required.

Returns public-facing settings for the order link flow (e.g. business name, logo).
