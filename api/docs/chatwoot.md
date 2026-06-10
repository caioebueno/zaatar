# Chatwoot API

Base URL (local): `http://localhost:4000`  
Auth: manager access token required.

## Route

`GET /conversation`

This is the only Chatwoot list route in the API.  
Old chat routes were removed and replaced by this branch-aware proxy.

`GET /conversation/:conversationId/messages`

Returns message history for a specific Chatwoot conversation.

`GET /conversation/events`

Returns buffered realtime events for chat list/messages. Use this as reconnect backfill.

`GET /conversation/stream`

SSE realtime stream for chat list/messages updates.

`POST /conversation/:conversationId/messages`

Sends a message to a specific Chatwoot conversation.

`POST /conversation/:conversationId/take-care`

Assigns a conversation to the branch's configured Chatwoot agent.

`POST /conversation/:conversationId/resolve`

Marks a conversation as resolved in Chatwoot.

`POST /conversation/:conversationId/read`

Marks all conversation messages as read in Chatwoot.

## What This Endpoint Does

1. Validates `branchId` from query string.
2. Ensures the branch belongs to the authenticated business.
3. Loads Chatwoot config from branch:
   - `Branch.chatwootAccountId`
   - `Branch.chatwootSourceId`
4. Calls Chatwoot:
   - `GET /api/v1/accounts/:chatwootAccountId/conversations`
   - Header: `api_access_token: <CHATWOOT_API_ACCESS_TOKEN>`
5. Returns Chatwoot response with status abstraction applied per conversation.

## Query Parameters

### Required

- `branchId` (`string`)
  - Branch to scope the Chatwoot account/source.
  - Must belong to the current authenticated business.

### Optional (Forwarded to Chatwoot)

Any extra query param is forwarded as-is. Common ones:

- `page` (`int > 0`)
- `per_page` (`int > 0`)
- `status` (`string`)
- `assignee_type` (`string`)
- `inbox_id` (`string | number`)
- `labels` (`string`)
- `q` (`string`)

### Conversation Messages Required Params

For `GET /conversation/:conversationId/messages`:

- path param `conversationId` (`string`)
- query `branchId` (`string`)

### Realtime Events Required Params

For `GET /conversation/events`:

- query `branchId` (`string`)
- optional query `conversationId` (`string`)
- optional query `afterEventId` (`string`)
- optional query `limit` (`int`, default `100`, max internal window)

For `GET /conversation/stream`:

- query `branchId` (`string`)
- optional query `conversationId` (`string`)
- optional query `afterEventId` (`string`)
- optional header `Last-Event-ID` (`string`)

### Send Message Required Params

For `POST /conversation/:conversationId/messages`:

- path param `conversationId` (`string`)
- query `branchId` (`string`)
- body:
  - `content` (`string`, required)
  - `private` (`boolean`, optional, default `false`)
  - `content_attributes` (`object`, optional)

### Take Care Required Params

For `POST /conversation/:conversationId/take-care`:

- path param `conversationId` (`string`)
- query `branchId` (`string`)
- branch config:
  - `Branch.chatwootAccountId`
  - `Branch.chatwootAgentId` (numeric string)

### Resolve Required Params

For `POST /conversation/:conversationId/resolve`:

- path param `conversationId` (`string`)
- query `branchId` (`string`)
- branch config:
  - `Branch.chatwootAccountId`

### Mark Read Required Params

For `POST /conversation/:conversationId/read`:

- path param `conversationId` (`string`)
- query `branchId` (`string`)
- branch config:
  - `Branch.chatwootAccountId`

## Behavior Details

- `inbox_id` fallback:
  - API no longer forces `inbox_id` by default.
  - If caller sends `inbox_id`, API forwards it as-is.
  - As an internal fallback, API may retry with `Branch.chatwootSourceId` when upstream returns not-found.
- `status` behavior:
  - API always enforces `status=all`.
  - If caller sends `status`, it is overridden to `all`.
  - API then filters out conversations where original Chatwoot status is `resolved`.
- list response status abstraction:
  - `status = "take_care"` when `assignee_id` is present.
  - `status = "ai_handling"` when `assignee_id` is null.
  - Original Chatwoot status is preserved in `chatwootStatus`.
- `page` / `per_page` validation:
  - If present, both must be positive integers.

## App Status Abstraction

For app UI, Chatwoot statuses should be abstracted into two buckets based only on assignment:

| App Status Key | App Label | Rule |
|---|---|---|
| `ai_handling` | `AI is handling` | `assignee_id` is `null` |
| `take_care` | `Take care` | `assignee_id` is not `null` |

Notes:
- Do not depend on Chatwoot `status` (`open`, `pending`, `resolved`, etc.) for this UI state.
- This keeps behavior consistent even when Chatwoot status transitions change.

## Request Example

```bash
curl --request GET \
  --url 'http://localhost:4000/api/conversation?branchId=branch_123&page=1&per_page=25' \
  --header 'Authorization: Bearer <manager_access_token>'
```

### Conversation Messages Request Example

```bash
curl --request GET \
  --url 'http://localhost:4000/api/conversation/123/messages?branchId=branch_123&page=1' \
  --header 'Authorization: Bearer <manager_access_token>'
```

### Realtime Events Request Example

```bash
curl --request GET \
  --url 'http://localhost:4000/api/conversation/events?branchId=branch_123&afterEventId=<event_id>' \
  --header 'Authorization: Bearer <manager_access_token>'
```

### Realtime Stream (SSE) Request Example

```bash
curl --request GET \
  --url 'http://localhost:4000/api/conversation/stream?branchId=branch_123' \
  --header 'Authorization: Bearer <manager_access_token>' \
  --header 'Accept: text/event-stream'
```

### Send Message Request Example

```bash
curl --request POST \
  --url 'http://localhost:4000/api/conversation/123/messages?branchId=branch_123' \
  --header 'Authorization: Bearer <manager_access_token>' \
  --header 'Content-Type: application/json' \
  --data '{
    "content": "Hello! Your order is on the way."
  }'
```

### Take Care Request Example

```bash
curl --request POST \
  --url 'http://localhost:4000/api/conversation/123/take-care?branchId=branch_123' \
  --header 'Authorization: Bearer <manager_access_token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### Resolve Request Example

```bash
curl --request POST \
  --url 'http://localhost:4000/api/conversation/123/resolve?branchId=branch_123' \
  --header 'Authorization: Bearer <manager_access_token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### Mark Read Request Example

```bash
curl --request POST \
  --url 'http://localhost:4000/api/conversation/123/read?branchId=branch_123' \
  --header 'Authorization: Bearer <manager_access_token>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

## Success Response (`200`)

Chatwoot response is returned with conversation `status` abstraction.

Example:

```json
{
  "data": {
    "meta": {
      "all_count": 120,
      "mine_count": 8
    },
    "payload": [
      {
        "id": 123,
        "account_id": 1,
        "inbox_id": 2,
        "status": "take_care",
        "chatwootStatus": "open"
      }
    ]
  }
}
```

### Take Care Success (`200`)

Returns Chatwoot assignment response unchanged (conversation object).

### Resolve Success (`200`)

Returns Chatwoot toggle-status response unchanged (conversation object).

### Mark Read Success (`200`)

Returns Chatwoot mark-read response unchanged.

### Realtime Events Success (`200`)

```json
{
  "events": [
    {
      "id": "2f9f73cf-d2f4-4b53-98f4-7b6f43d72d52",
      "createdAt": "2026-05-26T14:20:31.120Z",
      "businessId": "business_123",
      "branchId": "branch_123",
      "conversationId": "456",
      "type": "message_created",
      "data": {
        "event": "message_created",
        "content": "Hello",
        "senderName": "John"
      }
    }
  ]
}
```

### Stream Event Schema (`chatwoot_event`)

SSE event name: `chatwoot_event`  
Payload shape matches each item in `/conversation/events`.

### Response Schema (Detailed)

The API returns Chatwoot conversations payload with API enrichments (`status` abstraction and `order`).  
Top-level schema (current expected shape):

```ts
type ConversationListResponse = {
  data: {
    meta?: {
      all_count?: number;
      mine_count?: number;
      assigned_count?: number;
      unassigned_count?: number;
      [key: string]: unknown;
    };
    payload?: ConversationSummary[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ConversationSummary = {
  id: number;
  account_id?: number;
  inbox_id?: number;
  status?: "ai_is_handling" | "take_care";
  chatwootStatus?: string; // original Chatwoot status
  assignee_id?: number | null;
  order?: OrderDetail | null; // latest order found by customer phone
  orderIntent?: OrderIntentDetail | null; // active order intent found by customer phone
  contact_inbox?: unknown;
  last_activity_at?: number | string | null;
  timestamp?: number | string | null;
  unread_count?: number;
  messages?: unknown[];
  meta?: {
    sender?: unknown;
    assignee?: unknown;
    hmac_verified?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type OrderDetail = {
  id: string;
  number: string | null;
  createdAt: string; // ISO-8601
  orderType: string;
  paymentMethod: string;
  status: string;
  canceled: boolean;
  customer: {
    name: string | null;
    phone: string | null;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitAmountCents: number;
    lineTotalCents: number;
  }>;
  subtotalCents: number;
  discountedSubtotalCents: number;
  tipPercent: number;
  tipAmountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};

type OrderIntentDetail = {
  id: string;
  customerId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  language: string | null;
  status: string;
  type: string;
  paymentMethod: string;
  paymentProvider: string | null;
  tipAmount: number | null;
  tags: string[];
  progressiveDiscountSnapshot: unknown;
  amount: number | null;
  deliveryAddress: DeliveryAddress | null;
  deliveryAddressId: string | null;
  orderProducts: Array<{
    id: string;
    productId: string;
    quantity: number;
    comments: string | null;
    fullAmount: number | null;
    amount: number | null;
    modifierGroupItemIds: string[];
  }>;
};

type DeliveryAddress = {
  id: string;
  description: string;
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string;
  lng: string;
  deliveryFee: number;
  expectedHandoffDuration: number; // seconds, default 300
};
```

#### Field Notes

| Path | Type | Description |
|---|---|---|
| `data` | `object` | Chatwoot response container |
| `data.meta` | `object` | Aggregates/counters for current query |
| `data.meta.all_count` | `number` | Total conversations matching query scope |
| `data.meta.mine_count` | `number` | Conversations assigned to current Chatwoot agent context |
| `data.payload` | `array` | Conversation list for requested page |
| `data.payload[].id` | `number` | Conversation ID |
| `data.payload[].inbox_id` | `number` | Chatwoot inbox/source identifier |
| `data.payload[].status` | `"ai_is_handling" \| "take_care"` | Status abstraction used by app |
| `data.payload[].chatwootStatus` | `string` | Original Chatwoot status value |
| `data.payload[].assignee_id` | `number \| null` | Assigned agent ID |
| `data.payload[].order` | `OrderDetail \| null` | Latest order matched by customer phone |
| `data.payload[].orderIntent` | `OrderIntentDetail \| null` | Active order intent matched by customer phone |
| `data.payload[].orderIntent.deliveryAddress` | `DeliveryAddress \| null` | Delivery address object when order intent has linked address |
| `data.payload[].meta` | `object` | Contact/assignee metadata |

> `order` enrichment uses phone matching against customer records. If no phone/no match, `order` is `null`.
>
> `orderIntent` enrichment uses phone matching against customer records. If no phone/no match, `orderIntent` is `null`.
>
> Compatibility note: Chatwoot can add/remove fields over time. Your client should treat unknown fields as optional and avoid strict exhaustive parsing.

### Conversation Messages Success Schema (`200`)

This route also returns Chatwoot payload unchanged.

```ts
type ConversationMessagesResponse = {
  meta?: {
    count?: number;
    [key: string]: unknown;
  };
  payload?: ConversationMessage[];
  [key: string]: unknown;
};

type ConversationMessage = {
  id: number;
  content?: string | null;
  message_type?: number; // Chatwoot enum
  private?: boolean;
  created_at?: number | string;
  content_attributes?: {
    sent_by?: string; // "ai" when sent by AI
    [key: string]: unknown;
  };
  sender?: unknown;
  attachments?: unknown[];
  [key: string]: unknown;
};
```

AI message detection rule (recommended):
- First, check `content_attributes.sent_by === "ai"`.
- Fallback for older payloads: `sender.type` contains `"bot"`.

Example:

```json
{
  "meta": { "count": 2 },
  "payload": [
    {
      "id": 9991,
      "content": "Hello!",
      "message_type": 0,
      "private": false,
      "created_at": 1716670100
    },
    {
      "id": 9992,
      "content": "How can I help you?",
      "message_type": 1,
      "private": false,
      "created_at": 1716670140
    }
  ]
}
```

### Send Message Success (`200`)

Returns Chatwoot created message payload unchanged.

## Error Responses

### `401 Unauthorized`

```json
{ "error": "Unauthorized" }
```

### `400 Invalid payload` (missing/invalid `branchId`, `page`, `per_page`)

```json
{
  "error": "Invalid payload",
  "field": "branchId"
}
```

### `404 Branch not found` (branch does not exist or is outside current business)

```json
{
  "error": "Branch not found",
  "field": "branchId"
}
```

### `400 BRANCH_CHATWOOT_CONFIG_MISSING`

```json
{
  "error": "Invalid payload",
  "field": "chatwootAgentId",
  "reason": "BRANCH_CHATWOOT_CONFIG_MISSING"
}
```

### `503 CHATWOOT_NOT_CONFIGURED`

```json
{
  "error": "CHATWOOT_NOT_CONFIGURED",
  "field": "CHATWOOT_API_ACCESS_TOKEN"
}
```

### `4xx/5xx CHATWOOT_REQUEST_FAILED` (upstream error passthrough)

```json
{
  "error": "CHATWOOT_REQUEST_FAILED",
  "statusCode": 401,
  "response": {
    "error": "Invalid access token"
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CHATWOOT_BASE_URL` | No | `https://chatwoot-production-487ab.up.railway.app` | Chatwoot base URL |
| `CHATWOOT_API_ACCESS_TOKEN` | Yes | — | Chatwoot API token sent as `api_access_token` |
