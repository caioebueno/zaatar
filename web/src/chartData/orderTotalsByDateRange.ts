import prisma from "../../prisma";
import { SALES_TAX_RATE } from "@/src/constants/pricing";

const FLORIDA_TIME_ZONE = "America/New_York";

export type OrderTotalsByDateRange = {
  startDate: string;
  endDate: string;
  orders: number;
  totalInCents: number;
  totalInDollars: number;
};

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function getOrderTotalsByDateRange(input: {
  startDate: string;
  endDate: string;
}): Promise<OrderTotalsByDateRange> {
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();

  if (!isIsoDate(startDate)) {
    throw new Error("startDate");
  }

  if (!isIsoDate(endDate)) {
    throw new Error("endDate");
  }

  if (startDate > endDate) {
    throw new Error("dateRange");
  }

  const [row] = await prisma.$queryRaw<
    Array<{
      total_cents: string;
      orders: string;
    }>
  >`
    WITH order_totals AS (
      SELECT
        o."id",
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
      WHERE (o."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date >= ${startDate}::date
        AND (o."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date <= ${endDate}::date
        AND COALESCE(o."canceled", false) = false
      GROUP BY
        o."id",
        da."deliveryFee",
        o."tipAmount",
        o."progressiveDiscountSnapshot"
    )
    SELECT
      COALESCE(
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
        ),
        0
      )::text AS total_cents,
      COUNT(*)::text AS orders
    FROM order_totals;
  `;

  const totalInCents = Number(row?.total_cents ?? "0");
  const orders = Number(row?.orders ?? "0");

  return {
    startDate,
    endDate,
    orders,
    totalInCents,
    totalInDollars: totalInCents / 100,
  };
}
