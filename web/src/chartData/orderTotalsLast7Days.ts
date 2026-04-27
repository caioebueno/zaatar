import prisma from "../../prisma";
import { SALES_TAX_RATE } from "@/src/constants/pricing";

const FLORIDA_TIME_ZONE = "America/New_York";

export type OrderTotalsLast7DaysPoint = {
  day: string; // YYYY-MM-DD
  total: number; // USD
  orders: number;
};

export async function orderTotalsLast7Days(): Promise<
  OrderTotalsLast7DaysPoint[]
> {
  const rows = await prisma.$queryRaw<
    Array<{
      day: string;
      total_cents: string;
      orders: string;
    }>
  >`
    WITH local_bounds AS (
      SELECT date_trunc('day', timezone(${FLORIDA_TIME_ZONE}, now()))::timestamp AS local_today_start
    ),
    days AS (
      SELECT (
        local_bounds.local_today_start - (gs::text || ' days')::interval
      )::date AS day
      FROM local_bounds, generate_series(6, 0, -1) AS gs
    ),
    totals AS (
      SELECT
        order_totals.day,
        SUM(
          GREATEST(0, order_totals.discounted_subtotal_cents)
          + order_totals.delivery_fee_cents
          + ROUND(
            GREATEST(0, order_totals.discounted_subtotal_cents)
            * order_totals.tip_percentage / 100.0
          )::bigint
          + ROUND(
            GREATEST(0, order_totals.discounted_subtotal_cents)::numeric * ${SALES_TAX_RATE}::numeric
          )::bigint
        )::bigint AS total_cents,
        COUNT(*)::bigint AS orders
      FROM (
        SELECT
          o."id",
          (o."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date AS day,
          COALESCE(da."deliveryFee", 0)::bigint AS delivery_fee_cents,
          COALESCE(o."tipAmount", 0)::numeric AS tip_percentage,
          CASE
            WHEN o."progressiveDiscountSnapshot" IS NOT NULL
              AND jsonb_typeof(o."progressiveDiscountSnapshot"::jsonb) = 'object'
              AND (o."progressiveDiscountSnapshot"::jsonb ? 'discountedPrice')
            THEN ROUND(
              (o."progressiveDiscountSnapshot"::jsonb ->> 'discountedPrice')::numeric
            )::bigint
            ELSE COALESCE(SUM(op."amount" * op."quantity"), 0)::bigint
          END AS discounted_subtotal_cents
        FROM "Order" o
        LEFT JOIN "OrderProducts" op ON op."orderId" = o."id"
        LEFT JOIN "DeliveryAddress" da ON da."id" = o."deliveryAddressId"
        WHERE (o."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date >= (
          SELECT (local_today_start::date - 6) FROM local_bounds
        )
          AND COALESCE(o."canceled", false) = false
        GROUP BY
          o."id",
          o."createdAt",
          da."deliveryFee",
          o."tipAmount",
          o."progressiveDiscountSnapshot"
      ) AS order_totals
      GROUP BY order_totals.day
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS day,
      COALESCE(t.total_cents, 0)::text AS total_cents,
      COALESCE(t.orders, 0)::text AS orders
    FROM days d
    LEFT JOIN totals t ON t.day = d.day
    ORDER BY d.day ASC;
  `;

  return rows.map((row) => ({
    day: row.day,
    total: Number(row.total_cents) / 100,
    orders: Number(row.orders),
  }));
}
