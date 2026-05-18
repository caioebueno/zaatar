# Analytics API (API Project)

Base URL (local): `http://localhost:4000`

## Sales Analytics (Manager Owner Auth)

Endpoints:

- `GET /analytics/sales`
- `GET /analytics/orders/sales`

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

Optional:

- `timezone` (default: `America/New_York`)

Date format:

- `YYYY-MM-DD`

Rules:

- `startDate <= endDate`
- max range: `367` days

### Example request

```http
GET /analytics/orders/sales?startDate=2026-05-01&endDate=2026-05-18&timezone=America/New_York
Authorization: Bearer <manager-access-token>
```

### Success response (`200`)

```ts
type AnalyticsSalesResponse = {
  // Preferred fields for UI cards/charts
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  timezone: string;
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
  "startDate": "2026-05-01",
  "endDate": "2026-05-18",
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
  "from": "2026-05-01",
  "to": "2026-05-18",
  "timezone": "America/New_York",
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
- Sales totals include `OrderProducts subtotal + tip + deliveryFee` (delivery orders), without using `Order.amount`.

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
