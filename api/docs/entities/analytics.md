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
```

## APIs

- `GET /analytics/sales`
- `GET /analytics/orders/sales`

## Detailed Docs

- [analytics.md](../analytics.md)
