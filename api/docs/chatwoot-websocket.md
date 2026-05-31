# Chatwoot WebSocket Implementation Guide

Base URL (local): `http://localhost:4000`

This guide defines the recommended real-time architecture between Chatwoot and your React Native app using a WebSocket-style event model.

## Goal

Keep **chat list** and **chat messages** in sync in real time while keeping Chatwoot credentials server-side.

---

## Recommended Architecture

1. Chatwoot sends webhooks to your API (`/webhooks/chatwoot`).
2. API validates webhook signature/token.
3. API maps Chatwoot account/inbox to your `businessId` + `branchId`.
4. API publishes normalized real-time events.
5. Mobile app consumes:
   - live stream connection
   - reconnect backfill endpoint

> Current API transport is SSE (`/conversation/stream`) + backfill (`/conversation/events`).  
> The event contract below is compatible with future native WebSocket transport.

---

## Event Contract

All realtime events use the same payload:

```ts
type ChatwootRealtimeEvent = {
  id: string;
  createdAt: string; // ISO
  businessId: string;
  branchId: string;
  conversationId: string | null;
  type:
    | "message_created"
    | "conversation_status_changed"
    | "conversation_taken_care"
    | "conversation_resolved"
    | "conversation_message_sent";
  data: Record<string, unknown>;
};
```

## Sources of Events

- `message_created` / `conversation_status_changed`: from Chatwoot webhook
- `conversation_message_sent`: when your API sends a message
- `conversation_taken_care`: when your API takes care of a conversation
- `conversation_resolved`: when your API resolves a conversation

---

## APIs to Consume Real-Time

### 1) Live stream

`GET /conversation/stream?branchId=<branchId>&conversationId=<optional>&afterEventId=<optional>`

- Auth: manager token
- Stream event name: `chatwoot_event`
- Supports `Last-Event-ID` header for resume

### 2) Reconnect/backfill

`GET /conversation/events?branchId=<branchId>&conversationId=<optional>&afterEventId=<optional>&limit=<optional>`

- Auth: manager token
- Returns buffered events in JSON

---

## React Native Realtime Flow

1. Open stream for selected branch:
   - `/conversation/stream?branchId=...`
2. Track latest `event.id` locally.
3. On disconnect/reconnect:
   - call `/conversation/events?branchId=...&afterEventId=<lastSeen>`
   - apply missed events
   - reopen stream
4. If app is backgrounded, use push notification as wake-up signal and then backfill on foreground.

---

## Event Handling Rules

### Chat list screen

- Update preview text/time from latest `message_created` / `conversation_message_sent`
- Update status badge from:
  - `conversation_taken_care` => `take_care`
  - `conversation_resolved` => hide from active list or mark resolved
  - `conversation_status_changed` => sync fallback status when needed
- Update unread badge when event is inbound customer message and current chat is not open

### Chat thread screen

- Append new message on:
  - `message_created` (inbound)
  - `conversation_message_sent` (outbound)
- Update UI state:
  - `conversation_taken_care`
  - `conversation_resolved`

---

## Security

- Never expose Chatwoot API token to mobile.
- Authorize stream/backfill with manager access token.
- Always enforce business/branch ownership server-side.

---

## Reliability Notes

- Use event `id` for idempotency in client reducers.
- Keep an in-memory or persistent event buffer on API.
- For horizontal scaling, move event bus/buffer to Redis (pub/sub + stream).

---

## Optional Future WebSocket Transport

When you switch from SSE to true WebSocket, keep:

- same auth model
- same event payload contract
- same reconnect backfill API (`/conversation/events`)

This avoids RN app protocol churn.
