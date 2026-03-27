import prisma from "../../prisma";

type AvgTicketByMonthRow = {
  month: string; // "YYYY-MM"
  avgTicket: number; // average order amount in dollars
  orders: number; // number of orders
  revenue: number; // total revenue in dollars
};

export async function averageTicketByMonth(
  monthsBack = 12,
): Promise<AvgTicketByMonthRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      month: string;
      avg_cents: string; // returned as text from pg numeric
      orders: string;
      revenue_cents: string;
    }>
  >`
    SELECT
      to_char(date_trunc('month', o."createdAt"), 'YYYY-MM') AS month,
      AVG(o.amount)::numeric AS avg_cents,
      COUNT(*)::bigint AS orders,
      SUM(o.amount)::bigint AS revenue_cents
    FROM "Order" o
    WHERE o."createdAt" >= (date_trunc('month', now()) - (${monthsBack}::int || ' months')::interval)
    GROUP BY date_trunc('month', o."createdAt")
    ORDER BY date_trunc('month', o."createdAt") ASC;
  `;

  // convert cents -> dollars + parse numeric strings safely
  return rows.map((r) => ({
    month: r.month,
    avgTicket: Number(r.avg_cents),
    orders: Number(r.orders),
    revenue: Number(r.revenue_cents),
  }));
}
