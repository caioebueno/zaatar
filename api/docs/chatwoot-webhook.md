# Chatwoot Webhook + iOS Push

Base URL (local): `http://localhost:4000`

This page documents:

1. Webhook ingest route from Chatwoot
2. iOS push token registration route for manager users

---

## 1) Chatwoot Webhook Ingest

`POST /webhooks/chatwoot`

Auth: none (server-to-server webhook).

The API:

1. Validates webhook signature/token when `CHATWOOT_WEBHOOK_SECRET` is set.
2. Parses Chatwoot payload.
3. Accepts only incoming customer messages (`event = message_created` and incoming direction).
4. Maps Chatwoot account/inbox to a branch/business.
5. Sends push notification to all registered iOS devices for owners of that business.

### Supported webhook headers

- `x-chatwoot-signature` (HMAC SHA256)
- `x-chatwoot-token` (plain token fallback)

If `CHATWOOT_WEBHOOK_SECRET` is unset, signature verification is skipped.

### Request body (minimum fields used)

```json
{
  "event": "message_created",
  "account": { "id": 123 },
  "conversation": { "id": 456, "inbox_id": 789 },
  "message_type": "incoming",
  "content": "Hello"
}
```

### Success response

```json
{
  "ok": true,
  "event": "message_created",
  "matched": true,
  "notificationsSent": 2
}
```

### Possible skipped reasons

- `NON_INCOMING_MESSAGE`
- `BRANCH_NOT_MAPPED`
- `NO_REGISTERED_IOS_DEVICES`

---

## 2) Register iOS Push Device Token

`POST /owners/me/push-devices/ios`

Auth: manager access token required.

Registers (or updates) an iOS push token for the authenticated owner and active business.

### Request body

```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

### Success response

```json
{
  "ok": true
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CHATWOOT_WEBHOOK_SECRET` | No | — | If set, validates `x-chatwoot-signature` HMAC SHA256 or `x-chatwoot-token` |
| `EXPO_PUSH_API_BASE_URL` | No | `https://exp.host/--/api/v2/push/send` | Expo Push send endpoint |
| `EXPO_ACCESS_TOKEN` | No | — | Optional Expo access token for authenticated push sends |

