import prisma from "../../prisma";

export type CustomerFreqByMonth = {
  month: string; // "YYYY-MM"
  activeCustomers: number; // customers with >= 1 order in that month
  totalOrders: number; // total orders in that month
  weeks: number; // days_in_month / 7
  avgOrdersPerCustomerPerWeek: number;
};

export async function getAvgOrdersPerWeekByMonth(
  monthsBack = 6,
): Promise<CustomerFreqByMonth[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      month: string;
      active_customers: string;
      total_orders: string;
      weeks: string;
      avg_per_customer_per_week: string;
    }>
  >`
    WITH months AS (
      SELECT
        date_trunc('month', d)::date AS month_start,
        (date_trunc('month', d) + interval '1 month')::date AS month_end,
        ((date_trunc('month', d) + interval '1 month')::date - date_trunc('month', d)::date)::numeric / 7 AS weeks
      FROM generate_series(
        date_trunc('month', now()) - (${monthsBack}::int * interval '1 month'),
        date_trunc('month', now()),
        interval '1 month'
      ) AS d
    ),
    orders_in_month AS (
      SELECT
        m.month_start,
        o."customerId",
        COUNT(*)::int AS orders_count
      FROM months m
      JOIN "Order" o
        ON o."createdAt" >= m.month_start
       AND o."createdAt" <  m.month_end
      GROUP BY m.month_start, o."customerId"
    ),
    agg AS (
      SELECT
        m.month_start,
        m.weeks,
        COUNT(oim."customerId")::bigint AS active_customers,
        COALESCE(SUM(oim.orders_count), 0)::bigint AS total_orders,
        COALESCE(AVG(oim.orders_count::numeric / NULLIF(m.weeks, 0)), 0)::numeric AS avg_per_customer_per_week
      FROM months m
      LEFT JOIN orders_in_month oim
        ON oim.month_start = m.month_start
      GROUP BY m.month_start, m.weeks
    )
    SELECT
      to_char(a.month_start, 'YYYY-MM') AS month,
      a.active_customers::text AS active_customers,
      a.total_orders::text AS total_orders,
      a.weeks::text AS weeks,
      a.avg_per_customer_per_week::text AS avg_per_customer_per_week
    FROM agg a
    ORDER BY a.month_start ASC;
  `;

  return rows.map((r) => ({
    month: r.month,
    activeCustomers: Number(r.active_customers) || 0,
    totalOrders: Number(r.total_orders) || 0,
    weeks: Number(r.weeks) || 0,
    avgOrdersPerCustomerPerWeek: Number(r.avg_per_customer_per_week) || 0,
  }));
}
