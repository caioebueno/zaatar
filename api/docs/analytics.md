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
| `startDate` | `start`, `from` | Yes | Start date (`YYYY-MM-DD`) |
| `endDate` | `end`, `to` | Yes | End date (`YYYY-MM-DD`) |
| `timezone` | — | No | IANA timezone (default `America/New_York`) |

Rules:

- `startDate <= endDate`
- Max range: 367 days

Example request:

```http
GET /analytics/orders/sales?startDate=2026-05-01&endDate=2026-05-18&timezone=America/New_York
Authorization: Bearer <manager-access-token>
```

### Success (`200`)

```ts
type AnalyticsSalesResponse = {
  // Primary fields
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  receitaTotal: number; // cents — total revenue
  ticketMedio: number; // cents — average ticket
  totalPedidos: number; // total order count
  evolucaoReceita: Array<{ date: string; receita: number }>; // daily revenue line chart
  volumePedidos: Array<{ date: string; pedidos: number }>; // daily order count bar chart

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

Sample response:

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
