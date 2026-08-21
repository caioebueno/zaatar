# Analytics API (API Project)

Base URL (local): `http://localhost:4000`

## Sales Analytics (Manager Owner Auth)

Endpoints:

- `GET /analytics/sales`
- `GET /analytics/orders/sales`
- `GET /v1/analytics/order-quantity`
- `GET /v1/analytics/revenue`
- `GET /v1/analytics/new-customers`
- `GET /v1/analytics/average-ticket`
- `GET /v1/analytics/customer-retention`

Both routes return the same payload.

### Purpose

Provides chart data for:

- `Receita total`
- `Ticket medio`
- `Total pedidos`
- `Evolucao de receita` (line chart by day)
- `Volume de pedidos` (bar chart by day)

### Authentication

- Requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`

### Business scope

- Data is automatically scoped to the authenticated manager business (`businessId` from token/cookie/header context).
- Orders are filtered by `Branch.businessId`.

### Query params

You can use either naming style:

- `startDate` and `endDate` (recommended)
- `start` and `end`
- `from` and `to` (legacy)

Date format:

- full datetime in ISO-8601 format (e.g. `2026-05-01T00:00:00.000Z`)

Rules:

- `startDate <= endDate`
- max range: `367` days

### Example request

```http
GET /analytics/orders/sales?startDate=2026-05-01T00:00:00.000Z&endDate=2026-05-18T23:59:59.999Z
Authorization: Bearer <manager-access-token>
```

### Success response (`200`)

```ts
type AnalyticsSalesResponse = {
  // Preferred fields for UI cards/charts
  startDate: string; // ISO-8601 datetime
  endDate: string; // ISO-8601 datetime
  receitaTotal: number; // cents
  ticketMedio: number; // cents
  totalPedidos: number;
  evolucaoReceita: Array<{
    date: string; // YYYY-MM-DD
    receita: number; // cents
  }>;
  volumePedidos: Array<{
    date: string; // YYYY-MM-DD
    pedidos: number;
  }>;

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

Sample:

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
    { "date": "2026-05-01", "sales": 12000, "orders": 5, "averageTicket": 2400 },
    { "date": "2026-05-02", "sales": 9500, "orders": 4, "averageTicket": 2375 }
  ]
}
```

### Notes

- Values are returned in **cents** to avoid floating point issues.
- Canceled orders are excluded.
- Sales totals include discounted item subtotal plus delivery fee, exclude collected tips, and do not use `Order.amount`.

### Validation errors (`400`)

Invalid date format:

```json
{
  "error": "Invalid payload",
  "field": "from"
}
```

Range too large or invalid order:

```json
{
  "error": "Invalid payload",
  "field": "dateRange"
}
```

Missing business context:

```json
{
  "error": "Invalid payload",
  "field": "businessId"
}
```

## Order Quantity Analytics V1 (Manager Owner Auth)

Endpoint:

- `GET /v1/analytics/order-quantity`

### Purpose

Provides bar-chart-ready order quantity buckets for a date range, with optional comparison data aligned by bucket.

### Authentication

- Requires manager owner access token:
  - `Authorization: Bearer <manager-access-token>`

### Query params

- `startDate` (required, ISO-8601 datetime)
- `endDate` (required, ISO-8601 datetime)
- `compareStartDate` (optional, ISO-8601 datetime)
- `timezone` (optional, IANA timezone, default `America/New_York`)

Rules:

- `startDate <= endDate`
- max range: `367` days
- comparison end date is derived automatically using the same duration as the main range

### Success response (`200`)

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

## Metric Analytics V1 (Manager Owner Auth)

Endpoints:

- `GET /v1/analytics/revenue`
- `GET /v1/analytics/new-customers`
- `GET /v1/analytics/average-ticket`

### Shared query params

- `startDate` (required, ISO-8601 datetime)
- `endDate` (required, ISO-8601 datetime)
- `compareStartDate` (optional, ISO-8601 datetime)
- `timezone` (optional, IANA timezone, default `America/New_York`)

### Shared response shape

```ts
type MetricAnalyticsResponse = {
  metric: "revenue" | "newCustomers" | "averageTicket";
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

## Customer Retention Analytics V1 (Manager Owner Auth)

Endpoint:

- `GET /v1/analytics/customer-retention`

### Purpose

Provides retention-oriented customer analytics for a date range, including:

- active customer count
- won customers and lost customers versus an optional comparison period
- customer distribution by order count buckets
- daily new vs returning customer activity and share

### Shared query params

- `startDate` (required, ISO-8601 datetime)
- `endDate` (required, ISO-8601 datetime)
- `compareStartDate` (optional, ISO-8601 datetime)
- `timezone` (optional, IANA timezone, default `America/New_York`)

### Notes

- `activeCustomerCount` means customers with at least one non-canceled order in the main range.
- `wonCustomers` means active now but not active in the comparison range.
- `lostCustomers` means the customer's last non-canceled order was at least 45 days before the selected `endDate`.
- `newVsReturningPerDay` is based on unique active customers per day, not raw orders.
- `+8` bucket means 9 or more orders.

Notes:

- `revenue` values are in cents and exclude collected tips.
- `averageTicket` values are in cents and `summary.total` is the overall average ticket across the full range.
- `newCustomers` counts customers whose first non-canceled order for the business falls inside each bucket.
