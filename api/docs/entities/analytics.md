# Entity: Analytics

## General Schema

```ts
type SalesAnalytics = {
  receitaTotal: number;
  ticketMedio: number;
  totalPedidos: number;
  evolucaoReceita: Array<{ date: string; sales: number }>;
  volumePedidos: Array<{ date: string; pedidos: number }>;
};

type OrderQuantityAnalytics = {
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

type MetricAnalytics = {
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

type RevenueAnalytics = MetricAnalytics & {
  metric: "revenue";
};

type NewCustomersAnalytics = MetricAnalytics & {
  metric: "newCustomers";
};

type AverageTicketAnalytics = MetricAnalytics & {
  metric: "averageTicket";
};

type CustomerRetentionAnalytics = {
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
    key: string;
    label: string;
    startDate: string;
    endDate: string;
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

## APIs

- `GET /analytics/sales`
- `GET /analytics/orders/sales`
- `GET /v1/analytics/order-quantity`
- `GET /v1/analytics/revenue`
- `GET /v1/analytics/new-customers`
- `GET /v1/analytics/average-ticket`
- `GET /v1/analytics/customer-retention`

## Detailed Docs

- [analytics.md](../analytics.md)
