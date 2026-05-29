# Entity: Conversation

## General Schema

```ts
type Conversation = {
  id: number;
  status: "ai_is_handling" | "take_care";
  chatwootStatus?: string;
  assignee_id?: number | null;
  order?: Order | null; // latest order by customer phone
  meta?: Record<string, unknown>;
};
```

## APIs

- `GET /conversation`
- `GET /conversation/:conversationId/messages`
- `POST /conversation/:conversationId/messages`
- `POST /conversation/:conversationId/take-care`
- `POST /conversation/:conversationId/resolve`
- `POST /conversation/:conversationId/read`
- `GET /conversation/events`
- `GET /conversation/stream`
- `POST /webhooks/chatwoot`
- `POST /owners/me/push-devices/ios`

## Detailed Docs

- [chatwoot.md](../chatwoot.md)
- [chatwoot-webhook.md](../chatwoot-webhook.md)
- [chatwoot-websocket.md](../chatwoot-websocket.md)
