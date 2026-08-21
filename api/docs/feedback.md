# Feedback API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## List Feedback

`GET /feedback`  
`GET /feedbacks`

Both paths return the same data.

### Query Params

| Param | Required | Description |
|---|---|---|
| `from` | No | Start date/datetime filter |
| `to` | No | End date/datetime filter |
| `timezone` | No | IANA timezone for date interpretation |
| `sentiment` | No | Filter by sentiment (e.g. `positive`, `negative`, `neutral`) |
| `limit` | No | Maximum number of results to return |

### Success (`200`)

Returns an array of feedback entries for the active business.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "<field-name>" }
```

---

## Feedback Analytics V1

`GET /v1/feedback`

Auth: manager access token required.

Returns feedback analytics for a date range, optional comparison range, and the full list of scores inside the main range.

### Query Params

| Param | Required | Description |
|---|---|---|
| `startDate` | Yes | Start datetime (`ISO-8601`, e.g. `2026-08-01T00:00:00.000Z`) |
| `endDate` | Yes | End datetime (`ISO-8601`, e.g. `2026-08-07T23:59:59.999Z`) |
| `compareStartDate` | No | Start datetime for the comparison range. End datetime is derived using the same duration as the main range. |
| `timezone` | No | IANA timezone used for daily chart grouping. Default: `America/New_York` |

Rules:

- `startDate <= endDate`
- Max range: 367 days
- `compareStartDate` must be full datetime when supplied

Example request:

```http
GET /v1/feedback?startDate=2026-08-01T00:00:00.000Z&endDate=2026-08-07T23:59:59.999Z&compareStartDate=2026-07-25T00:00:00.000Z&timezone=America/New_York
Authorization: Bearer <manager-access-token>
```

### Success (`200`)

```ts
type FeedbackAnalyticsResponse = {
  metric: "feedback";
  chartType: "line";
  timezone: string;
  range: {
    startDate: string;
    endDate: string;
  };
  comparison?: {
    startDate: string;
    endDate: string;
    quantityOfFeedback: number;
    quantityOfFeedbackDelta: number;
    quantityOfFeedbackDeltaPercentage: number | null;
    averageScore: number | null;
    averageScoreDelta: number | null;
    averageScoreDeltaPercentage: number | null;
    scoreCounts: {
      good: number;
      medium: number;
      bad: number;
    };
  };
  summary: {
    quantityOfFeedback: number;
    averageScore: number | null;
    scoreCounts: {
      good: number;
      medium: number;
      bad: number;
    };
  };
  averageScorePoints: Array<{
    date: string; // YYYY-MM-DD
    label: string; // e.g. "Aug 1"
    value: number | null;
    compareValue?: number | null;
    delta?: number | null;
    deltaPercentage?: number | null;
  }>;
  scores: Array<{
    id: string;
    createdAt: string;
    orderId: string;
    orderNumber: string | null;
    orderStatus: string | null;
    orderType: string | null;
    customerName: string | null;
    customerPhone: string | null;
    language: string | null;
    score: number;
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    productQuality: number | null;
    temperature: number | null;
    deliverySpeed: number | null;
    serviceExperience: number | null;
    comment: string | null;
    reward: {
      id: string;
      title: string;
      status: string;
      quantity: number | null;
      productId: string | null;
      productName: string | null;
    } | null;
  }>;
};
```

Sample response:

```json
{
  "metric": "feedback",
  "chartType": "line",
  "timezone": "America/New_York",
  "range": {
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2026-08-07T23:59:59.999Z"
  },
  "comparison": {
    "startDate": "2026-07-25T00:00:00.000Z",
    "endDate": "2026-07-31T23:59:59.999Z",
    "quantityOfFeedback": 18,
    "quantityOfFeedbackDelta": 4,
    "quantityOfFeedbackDeltaPercentage": 22.22,
    "averageScore": 4.11,
    "averageScoreDelta": 0.27,
    "averageScoreDeltaPercentage": 6.57,
    "scoreCounts": {
      "good": 12,
      "medium": 4,
      "bad": 2
    }
  },
  "summary": {
    "quantityOfFeedback": 22,
    "averageScore": 4.38,
    "scoreCounts": {
      "good": 16,
      "medium": 4,
      "bad": 2
    }
  },
  "averageScorePoints": [
    {
      "date": "2026-08-01",
      "label": "Aug 1",
      "value": 4.5,
      "compareValue": 4.2,
      "delta": 0.3,
      "deltaPercentage": 7.14
    }
  ],
  "scores": [
    {
      "id": "feedback-id",
      "createdAt": "2026-08-03T14:30:00.000Z",
      "orderId": "order-id",
      "orderNumber": "1042",
      "orderStatus": "DELIVERED",
      "orderType": "DELIVERY",
      "customerName": "John",
      "customerPhone": "+14075551234",
      "language": "en",
      "score": 5,
      "sentiment": "POSITIVE",
      "productQuality": 5,
      "temperature": 4,
      "deliverySpeed": 5,
      "serviceExperience": 5,
      "comment": "Great pizza",
      "reward": null
    }
  ]
}
```

### Notes

- `scoreCounts.good` maps to `POSITIVE`, `medium` maps to `NEUTRAL`, and `bad` maps to `NEGATIVE`.
- `averageScorePoints` returns one point per local day in the requested range.
- Days without feedback return `value: null` in the chart points.
- `scores` only includes entries from the main range, not the comparison range.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "startDate" }
{ "error": "Invalid payload", "field": "endDate" }
{ "error": "Invalid payload", "field": "compareStartDate" }
{ "error": "Invalid payload", "field": "timezone" }
{ "error": "Invalid payload", "field": "dateRange" }
{ "error": "Invalid payload", "field": "businessId" }
```
