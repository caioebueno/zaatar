import prisma from "../../../../prisma.js";
import type {
  AnalyticsRepository,
  OrderSalesDailyPoint,
  OrderSalesRangeQuery,
} from "../../application/ports/AnalyticsRepository.js";

type DailyRow = {
  date: string;
  orders: number;
  sales: string;
};

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async getOrderSalesByDateRange(
    query: OrderSalesRangeQuery,
  ): Promise<OrderSalesDailyPoint[]> {
    const rows = await prisma.$queryRaw<DailyRow[]>`
      WITH days AS (
        SELECT generate_series(
          ${query.from}::date,
          ${query.to}::date,
          interval '1 day'
        )::date AS day
      ),
      order_totals AS (
        SELECT
          orders."id" AS "orderId",
          timezone(${query.timezone}, orders."createdAt")::date AS day,
          COALESCE(orders."tipAmount", 0)::numeric AS tip_percentage,
          CASE
            WHEN orders."type"::text = 'DELIVERY'
            THEN COALESCE(MAX(delivery_address."deliveryFee"), 0)::numeric
            ELSE 0::numeric
          END AS delivery_fee_cents,
          CASE
            WHEN orders."progressiveDiscountSnapshot" IS NOT NULL
              AND jsonb_typeof(orders."progressiveDiscountSnapshot"::jsonb) = 'object'
              AND (orders."progressiveDiscountSnapshot"::jsonb ? 'discountedPrice')
              AND (orders."progressiveDiscountSnapshot"::jsonb ->> 'discountedPrice') ~ '^-?[0-9]+(\\.[0-9]+)?$'
            THEN
              (orders."progressiveDiscountSnapshot"::jsonb ->> 'discountedPrice')::numeric
            ELSE COALESCE(SUM(op."amount" * op."quantity"), 0)::numeric
          END AS discounted_subtotal_cents
        FROM "Order" orders
        INNER JOIN "Branch" branch
          ON branch."id" = orders."branchId"
        LEFT JOIN "DeliveryAddress" delivery_address
          ON delivery_address."id" = orders."deliveryAddressId"
        LEFT JOIN "OrderProducts" op
          ON op."orderId" = orders."id"
        WHERE orders."canceled" = false
          AND branch."businessId" = ${query.businessId}
          AND timezone(${query.timezone}, orders."createdAt")::date BETWEEN ${query.from}::date AND ${query.to}::date
        GROUP BY
          orders."id",
          timezone(${query.timezone}, orders."createdAt")::date,
          orders."tipAmount",
          orders."progressiveDiscountSnapshot"
      ),
      orders_agg AS (
        SELECT
          order_totals.day,
          COUNT(*)::int AS orders,
          COALESCE(
            SUM(
              GREATEST(0, order_totals.discounted_subtotal_cents)
              + ROUND(
                  (GREATEST(0, order_totals.discounted_subtotal_cents) * order_totals.tip_percentage) / 100.0
                )
              + GREATEST(0, order_totals.delivery_fee_cents)
            ),
            0
          )::bigint::text AS sales
        FROM order_totals
        GROUP BY order_totals.day
      )
      SELECT
        to_char(days.day, 'YYYY-MM-DD') AS date,
        COALESCE(orders_agg.orders, 0)::int AS orders,
        COALESCE(orders_agg.sales, '0') AS sales
      FROM days
      LEFT JOIN orders_agg ON orders_agg.day = days.day
      ORDER BY days.day ASC
    `;

    return rows.map((row: DailyRow) => ({
      date: row.date,
      orders: Number(row.orders || 0),
      sales: Number(row.sales || "0"),
    }));
  }
}
