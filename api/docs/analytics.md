# Analytics API

Base URL (local): `http://localhost:4000`

Auth: manager access token required.

---

## Sales Analytics

`GET /analytics/sales`  
`GET /analytics/orders/sales`

Both endpoints return the same payload. Data is scoped to the authenticated manager's business.

### Query Params

| Param | Aliases | Required | Description |
|---|---|---|---|
| `startDate` | `start`, `from` | Yes | Start datetime (`ISO-8601`, e.g. `2026-05-01T00:00:00.000Z`) |
| `endDate` | `end`, `to` | Yes | End datetime (`ISO-8601`, e.g. `2026-05-18T23:59:59.999Z`) |

Rules:

- `startDate <= endDate`
- Max range: 367 days

Example request:

```http
GET /analytics/orders/sales?startDate=2026-05-01T00:00:00.000Z&endDate=2026-05-18T23:59:59.999Z
Authorization: Bearer <manager-access-token>
```

### Success (`200`)

```ts
type AnalyticsSalesResponse = {
  // Primary fields
  startDate: string; // ISO-8601 datetime
  endDate: string; // ISO-8601 datetime
  receitaTotal: number; // cents — total revenue
  ticketMedio: number; // cents — average ticket
  totalPedidos: number; // total order count
  evolucaoReceita: Array<{ date: string; receita: number }>; // daily revenue line chart
  volumePedidos: Array<{ date: string; pedidos: number }>; // daily order count bar chart

  // Compatibility fields
  from: string; // ISO-8601 datetime
  to: string; // ISO-8601 datetime
  summary: {
    totalSales: number; // cents
    averageTicket: number; // cents
    totalOrders: number;
  };
  daily: Array<{
    date: string; // YYYY-MM-DD
    sales: number; // cents
    orders: number;
    averageTicket: number; // cents
  }>;
};
```

Sample response:

```json
{
  "startDate": "2026-05-01T00:00:00.000Z",
  "endDate": "2026-05-18T23:59:59.999Z",
  "receitaTotal": 123456,
  "ticketMedio": 2345,
  "totalPedidos": 52,
  "evolucaoReceita": [
    { "date": "2026-05-01", "receita": 12000 },
    { "date": "2026-05-02", "receita": 9500 }
  ],
  "volumePedidos": [
    { "date": "2026-05-01", "pedidos": 5 },
    { "date": "2026-05-02", "pedidos": 4 }
  ],
  "from": "2026-05-01T00:00:00.000Z",
  "to": "2026-05-18T23:59:59.999Z",
  "summary": {
    "totalSales": 123456,
    "averageTicket": 2345,
    "totalOrders": 52
  },
  "daily": [
    { "date": "2026-05-01", "sales": 12000, "orders": 5, "averageTicket": 2400 }
  ]
}
```

### Notes

- All monetary values are in **cents** (integer) to avoid floating-point issues.
- Canceled orders are excluded.
- Revenue totals = `OrderProducts subtotal + tip + deliveryFee` (not `Order.amount`).

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "from" }
{ "error": "Invalid payload", "field": "dateRange" }
{ "error": "Invalid payload", "field": "businessId" }
```

---

## Order Quantity Analytics V1

`GET /v1/analytics/order-quantity`

Auth: manager access token required.

Returns bar-chart-ready order quantity buckets for a date range, with optional comparison against another period starting at `compareStartDate`.

### Query Params

| Param | Required | Description |
|---|---|---|
| `startDate` | Yes | Start datetime (`ISO-8601`, e.g. `2026-08-01T00:00:00.000Z`) |
| `endDate` | Yes | End datetime (`ISO-8601`, e.g. `2026-08-07T23:59:59.999Z`) |
| `compareStartDate` | No | Start datetime for the comparison range. End datetime is derived using the same duration as the main range. |
| `timezone` | No | IANA timezone for bucket grouping and labels. Default: `America/New_York` |

Rules:

- `startDate <= endDate`
- Max range: 367 days
- `compareStartDate` must be full datetime when supplied

Example request:

```http
GET /v1/analytics/revenue?startDate=2026-08-01T00:00:00.000Z&endDate=2026-08-07T23:59:59.999Z&compareStartDate=2026-07-25T00:00:00.000Z&timezone=America/New_York
Authorization: Bearer <manager-access-token>
```

Rules:

- `startDate <= endDate`
- Max range: 367 days
- `compareStartDate` must be full datetime when supplied

Example request:

```http
GET /v1/analytics/order-quantity?startDate=2026-08-01T00:00:00.000Z&endDate=2026-08-07T23:59:59.999Z&compareStartDate=2026-07-25T00:00:00.000Z&timezone=America/New_York
Authorization: Bearer <manager-access-token>
```

### Success (`200`)

```ts
type OrderQuantityAnalyticsResponse = {
  metric: "orderQuantity";
  chartType: "bar";
  granularity: "day";
  timezone: string;
  range: {
    startDate: string;
    endDate: string;
  };
  comparison?: {
    startDate: string;
    endDate: string;
    total: number;
    delta: number;
    deltaPercentage: number | null;
  };
  summary: {
    total: number;
    averagePerBucket: number;
    maxBucketValue: number;
  };
  buckets: Array<{
    key: string; // YYYY-MM-DD
    label: string; // e.g. "Aug 1"
    startDate: string; // bucket start ISO datetime
    endDate: string; // bucket end ISO datetime
    value: number;
    compareValue?: number | null;
    delta?: number | null;
    deltaPercentage?: number | null;
  }>;
};
```

Sample response:

```json
{
  "metric": "orderQuantity",
  "chartType": "bar",
  "granularity": "day",
  "timezone": "America/New_York",
  "range": {
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2026-08-07T23:59:59.999Z"
  },
  "comparison": {
    "startDate": "2026-07-25T00:00:00.000Z",
    "endDate": "2026-07-31T23:59:59.999Z",
    "total": 61,
    "delta": 9,
    "deltaPercentage": 14.75
  },
  "summary": {
    "total": 70,
    "averagePerBucket": 10,
    "maxBucketValue": 14
  },
  "buckets": [
    {
      "key": "2026-08-01",
      "label": "Aug 1",
      "startDate": "2026-08-01T04:00:00.000Z",
      "endDate": "2026-08-02T03:59:59.999Z",
      "value": 8,
      "compareValue": 6,
      "delta": 2,
      "deltaPercentage": 33.33
    }
  ]
}
```

### Notes

- Bucket grouping is based on the requested `timezone`.
- Canceled orders are excluded.
- Comparison buckets are aligned by bucket position against the main range.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "startDate" }
{ "error": "Invalid payload", "field": "endDate" }
{ "error": "Invalid payload", "field": "compareStartDate" }
{ "error": "Invalid payload", "field": "timezone" }
{ "error": "Invalid payload", "field": "dateRange" }
{ "error": "Invalid payload", "field": "businessId" }
```

---

## Revenue Analytics V1

`GET /v1/analytics/revenue`

Auth: manager access token required.

Returns bar-chart-ready daily revenue buckets for a date range, with optional comparison against another period starting at `compareStartDate`.

### Query Params

| Param | Required | Description |
|---|---|---|
| `startDate` | Yes | Start datetime (`ISO-8601`, e.g. `2026-08-01T00:00:00.000Z`) |
| `endDate` | Yes | End datetime (`ISO-8601`, e.g. `2026-08-07T23:59:59.999Z`) |
| `compareStartDate` | No | Start datetime for the comparison range. End datetime is derived using the same duration as the main range. |
| `timezone` | No | IANA timezone for bucket grouping and labels. Default: `America/New_York` |

### Success (`200`)

```ts
type RevenueAnalyticsResponse = {
  metric: "revenue";
  chartType: "bar";
  granularity: "day";
  timezone: string;
  range: {
    startDate: string;
    endDate: string;
  };
  comparison?: {
    startDate: string;
    endDate: string;
    total: number; // cents
    delta: number; // cents
    deltaPercentage: number | null;
  };
  summary: {
    total: number; // cents
    averagePerBucket: number; // cents
    maxBucketValue: number; // cents
  };
  buckets: Array<{
    key: string;
    label: string;
    startDate: string;
    endDate: string;
    value: number; // cents
    compareValue?: number | null; // cents
    delta?: number | null; // cents
    deltaPercentage?: number | null;
  }>;
};
```

Sample response:

```json
{
  "metric": "revenue",
  "chartType": "bar",
  "granularity": "day",
  "timezone": "America/New_York",
  "range": {
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2026-08-07T23:59:59.999Z"
  },
  "comparison": {
    "startDate": "2026-07-25T00:00:00.000Z",
    "endDate": "2026-07-31T23:59:59.999Z",
    "total": 154320,
    "delta": 12680,
    "deltaPercentage": 8.22
  },
  "summary": {
    "total": 167000,
    "averagePerBucket": 23857.14,
    "maxBucketValue": 34100
  },
  "buckets": [
    {
      "key": "2026-08-01",
      "label": "Aug 1",
      "startDate": "2026-08-01T04:00:00.000Z",
      "endDate": "2026-08-02T03:59:59.999Z",
      "value": 21800,
      "compareValue": 19500,
      "delta": 2300,
      "deltaPercentage": 11.79
    }
  ]
}
```

### Notes

- Values are returned in **cents**.
- Revenue totals use discounted item subtotal and delivery fee, and exclude collected tips.
- Canceled orders are excluded.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "startDate" }
{ "error": "Invalid payload", "field": "endDate" }
{ "error": "Invalid payload", "field": "compareStartDate" }
{ "error": "Invalid payload", "field": "timezone" }
{ "error": "Invalid payload", "field": "dateRange" }
{ "error": "Invalid payload", "field": "businessId" }
```

---

## New Customers Analytics V1

`GET /v1/analytics/new-customers`

Auth: manager access token required.

Returns bar-chart-ready daily new-customer buckets for a date range, with optional comparison against another period starting at `compareStartDate`.

### Query Params

Same query params and rules as `GET /v1/analytics/revenue`.

### Success (`200`)

```ts
type NewCustomersAnalyticsResponse = {
  metric: "newCustomers";
  chartType: "bar";
  granularity: "day";
  timezone: string;
  range: {
    startDate: string;
    endDate: string;
  };
  comparison?: {
    startDate: string;
    endDate: string;
    total: number;
    delta: number;
    deltaPercentage: number | null;
  };
  summary: {
    total: number;
    averagePerBucket: number;
    maxBucketValue: number;
  };
  buckets: Array<{
    key: string;
    label: string;
    startDate: string;
    endDate: string;
    value: number;
    compareValue?: number | null;
    delta?: number | null;
    deltaPercentage?: number | null;
  }>;
};
```

Sample response:

```json
{
  "metric": "newCustomers",
  "chartType": "bar",
  "granularity": "day",
  "timezone": "America/New_York",
  "range": {
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2026-08-07T23:59:59.999Z"
  },
  "comparison": {
    "startDate": "2026-07-25T00:00:00.000Z",
    "endDate": "2026-07-31T23:59:59.999Z",
    "total": 18,
    "delta": 4,
    "deltaPercentage": 22.22
  },
  "summary": {
    "total": 22,
    "averagePerBucket": 3.14,
    "maxBucketValue": 6
  },
  "buckets": [
    {
      "key": "2026-08-01",
      "label": "Aug 1",
      "startDate": "2026-08-01T04:00:00.000Z",
      "endDate": "2026-08-02T03:59:59.999Z",
      "value": 4,
      "compareValue": 3,
      "delta": 1,
      "deltaPercentage": 33.33
    }
  ]
}
```

### Notes

- A customer is counted as new when their **first non-canceled order for the authenticated business** falls in the bucket.
- This is business-scoped, not global customer creation.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "startDate" }
{ "error": "Invalid payload", "field": "endDate" }
{ "error": "Invalid payload", "field": "compareStartDate" }
{ "error": "Invalid payload", "field": "timezone" }
{ "error": "Invalid payload", "field": "dateRange" }
{ "error": "Invalid payload", "field": "businessId" }
```

---

## Average Ticket Analytics V1

`GET /v1/analytics/average-ticket`

Auth: manager access token required.

Returns bar-chart-ready daily average-ticket buckets for a date range, with optional comparison against another period starting at `compareStartDate`.

### Query Params

Same query params and rules as `GET /v1/analytics/revenue`.

### Success (`200`)

```ts
type AverageTicketAnalyticsResponse = {
  metric: "averageTicket";
  chartType: "bar";
  granularity: "day";
  timezone: string;
  range: {
    startDate: string;
    endDate: string;
  };
  comparison?: {
    startDate: string;
    endDate: string;
    total: number; // cents
    delta: number; // cents
    deltaPercentage: number | null;
  };
  summary: {
    total: number; // overall average ticket for the whole range, in cents
    averagePerBucket: number; // average of bucket values, in cents
    maxBucketValue: number; // cents
  };
  buckets: Array<{
    key: string;
    label: string;
    startDate: string;
    endDate: string;
    value: number; // cents
    compareValue?: number | null; // cents
    delta?: number | null; // cents
    deltaPercentage?: number | null;
  }>;
};
```

Sample response:

```json
{
  "metric": "averageTicket",
  "chartType": "bar",
  "granularity": "day",
  "timezone": "America/New_York",
  "range": {
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2026-08-07T23:59:59.999Z"
  },
  "comparison": {
    "startDate": "2026-07-25T00:00:00.000Z",
    "endDate": "2026-07-31T23:59:59.999Z",
    "total": 2540,
    "delta": 120,
    "deltaPercentage": 4.72
  },
  "summary": {
    "total": 2660,
    "averagePerBucket": 2594.29,
    "maxBucketValue": 3100
  },
  "buckets": [
    {
      "key": "2026-08-01",
      "label": "Aug 1",
      "startDate": "2026-08-01T04:00:00.000Z",
      "endDate": "2026-08-02T03:59:59.999Z",
      "value": 2725,
      "compareValue": 2500,
      "delta": 225,
      "deltaPercentage": 9
    }
  ]
}
```

### Notes

- Average ticket is calculated as `revenue / orders`.
- Bucket values are rounded to the nearest cent integer.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "startDate" }
{ "error": "Invalid payload", "field": "endDate" }
{ "error": "Invalid payload", "field": "compareStartDate" }
{ "error": "Invalid payload", "field": "timezone" }
{ "error": "Invalid payload", "field": "dateRange" }
{ "error": "Invalid payload", "field": "businessId" }
```

---

## Customer Retention Analytics V1

`GET /v1/analytics/customer-retention`

Auth: manager access token required.

Returns customer retention analytics for a date range, including active customer count, won/lost customer counts against an optional comparison range, order-frequency buckets, and daily new-vs-returning customer activity.

### Query Params

| Param | Required | Description |
|---|---|---|
| `startDate` | Yes | Start datetime (`ISO-8601`, e.g. `2026-08-01T00:00:00.000Z`) |
| `endDate` | Yes | End datetime (`ISO-8601`, e.g. `2026-08-07T23:59:59.999Z`) |
| `compareStartDate` | No | Start datetime for the comparison range. End datetime is derived using the same duration as the main range. |
| `timezone` | No | IANA timezone for daily grouping and labels. Default: `America/New_York` |

Rules:

- `startDate <= endDate`
- Max range: 367 days
- `compareStartDate` must be full datetime when supplied

Example request:

```http
GET /v1/analytics/customer-retention?startDate=2026-08-01T00:00:00.000Z&endDate=2026-08-07T23:59:59.999Z&compareStartDate=2026-07-25T00:00:00.000Z&timezone=America/New_York
Authorization: Bearer <manager-access-token>
```

### Success (`200`)

```ts
type CustomerRetentionAnalyticsResponse = {
  metric: "customerRetention";
  chartType: "mixed";
  timezone: string;
  range: {
    startDate: string;
    endDate: string;
  };
  comparison?: {
    startDate: string;
    endDate: string;
    activeCustomerCount: number;
  };
  summary: {
    activeCustomerCount: number;
    wonCustomers: number | null;
    lostCustomers: number;
  };
  orderQuantityBuckets: Array<{
    key: "0" | "1" | "2-4" | "5-8" | "+8";
    label: string;
    customerCount: number;
    compareCustomerCount?: number | null;
    delta?: number | null;
    deltaPercentage?: number | null;
  }>;
  newVsReturningPerDay: Array<{
    key: string; // YYYY-MM-DD
    label: string; // e.g. "Aug 1"
    startDate: string; // bucket start ISO datetime
    endDate: string; // bucket end ISO datetime
    newCustomerCount: number;
    returningCustomerCount: number;
    totalCustomerCount: number;
    newCustomerShare: number | null;
    returningCustomerShare: number | null;
    compareNewCustomerCount?: number | null;
    compareReturningCustomerCount?: number | null;
    compareTotalCustomerCount?: number | null;
    compareNewCustomerShare?: number | null;
    compareReturningCustomerShare?: number | null;
  }>;
};
```

Sample response:

```json
{
  "metric": "customerRetention",
  "chartType": "mixed",
  "timezone": "America/New_York",
  "range": {
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2026-08-07T23:59:59.999Z"
  },
  "comparison": {
    "startDate": "2026-07-25T00:00:00.000Z",
    "endDate": "2026-07-31T23:59:59.999Z",
    "activeCustomerCount": 84
  },
  "summary": {
    "activeCustomerCount": 91,
    "wonCustomers": 19,
    "lostCustomers": 12
  },
  "orderQuantityBuckets": [
    { "key": "0", "label": "0 orders", "customerCount": 240, "compareCustomerCount": 228, "delta": 12, "deltaPercentage": 5.26 },
    { "key": "1", "label": "1 order", "customerCount": 48, "compareCustomerCount": 45, "delta": 3, "deltaPercentage": 6.67 },
    { "key": "2-4", "label": "2-4 orders", "customerCount": 31, "compareCustomerCount": 29, "delta": 2, "deltaPercentage": 6.9 },
    { "key": "5-8", "label": "5-8 orders", "customerCount": 9, "compareCustomerCount": 8, "delta": 1, "deltaPercentage": 12.5 },
    { "key": "+8", "label": "+8 orders", "customerCount": 3, "compareCustomerCount": 2, "delta": 1, "deltaPercentage": 50 }
  ],
  "newVsReturningPerDay": [
    {
      "key": "2026-08-01",
      "label": "Aug 1",
      "startDate": "2026-08-01T04:00:00.000Z",
      "endDate": "2026-08-02T03:59:59.999Z",
      "newCustomerCount": 6,
      "returningCustomerCount": 11,
      "totalCustomerCount": 17,
      "newCustomerShare": 35.29,
      "returningCustomerShare": 64.71,
      "compareNewCustomerCount": 4,
      "compareReturningCustomerCount": 10,
      "compareTotalCustomerCount": 14,
      "compareNewCustomerShare": 28.57,
      "compareReturningCustomerShare": 71.43
    }
  ]
}
```

### Notes

- `activeCustomerCount` counts customers with at least one non-canceled order in the main range.
- `wonCustomers` counts customers active in the main range but not active in the comparison range.
- `lostCustomers` counts customers whose last non-canceled order was at least 45 days before the selected `endDate`.
- `orderQuantityBuckets` are calculated over known customers for the business as of the range end. The `0` bucket means no orders in the selected range.
- `+8` means **9 or more** orders, since the previous bucket already covers `5-8`.
- `newVsReturningPerDay` is based on **unique active customers per local day**, not raw orders. A customer is `new` on the day of their first non-canceled order for the business and `returning` on later active days.

### Validation Errors (`400`)

```json
{ "error": "Invalid payload", "field": "startDate" }
{ "error": "Invalid payload", "field": "endDate" }
{ "error": "Invalid payload", "field": "compareStartDate" }
{ "error": "Invalid payload", "field": "timezone" }
{ "error": "Invalid payload", "field": "dateRange" }
{ "error": "Invalid payload", "field": "businessId" }
```
