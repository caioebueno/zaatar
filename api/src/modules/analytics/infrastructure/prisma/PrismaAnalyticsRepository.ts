import prisma from "../../../../prisma.js";
import type {
  AnalyticsDateRangeQuery,
  AnalyticsRepository,
  CustomerRetentionCustomerPoint,
  CustomerRetentionCustomersQuery,
  CustomerRetentionDailyPoint,
  NewCustomersBucketPoint,
  OrderQuantityBucketPoint,
  OrderSalesDailyPoint,
  OrderSalesRangeQuery,
  RevenueBucketPoint,
} from "../../application/ports/AnalyticsRepository.js";

type DailyRow = {
  date: string;
  orders: number;
  sales: string;
};

type OrderQuantityRow = {
  bucketEndAt: Date;
  bucketStartAt: Date;
  key: string;
  orders: number;
};

type RevenueRow = {
  bucketEndAt: Date;
  bucketStartAt: Date;
  key: string;
  orders: number;
  sales: string;
};

type NewCustomersRow = {
  bucketEndAt: Date;
  bucketStartAt: Date;
  customers: number;
  key: string;
};

type CustomerRetentionCustomerRow = {
  compareOrders: number;
  currentOrders: number;
  customerId: string;
  firstOrderAt: Date;
  lastOrderAt: Date;
};

type CustomerRetentionDailyRow = {
  bucketEndAt: Date;
  bucketStartAt: Date;
  key: string;
  newCustomers: number;
  returningCustomers: number;
};

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  async getCustomerRetentionCustomers(
    query: CustomerRetentionCustomersQuery,
  ): Promise<CustomerRetentionCustomerPoint[]> {
    const rows = await prisma.$queryRaw<CustomerRetentionCustomerRow[]>`
      SELECT
        orders."customerId" AS "customerId",
        MIN(orders."createdAt") AS "firstOrderAt",
        MAX(orders."createdAt") AS "lastOrderAt",
        COUNT(*) FILTER (
          WHERE orders."createdAt" >= ${query.startDate}::timestamptz
            AND orders."createdAt" <= ${query.endDate}::timestamptz
        )::int AS "currentOrders",
        COUNT(*) FILTER (
          WHERE ${query.compareStartDate}::timestamptz IS NOT NULL
            AND ${query.compareEndDate}::timestamptz IS NOT NULL
            AND orders."createdAt" >= ${query.compareStartDate}::timestamptz
            AND orders."createdAt" <= ${query.compareEndDate}::timestamptz
        )::int AS "compareOrders"
      FROM "Order" orders
      INNER JOIN "Branch" branch
        ON branch."id" = orders."branchId"
      WHERE orders."canceled" = false
        AND orders."customerId" IS NOT NULL
        AND branch."businessId" = ${query.businessId}
        AND orders."createdAt" <= COALESCE(
          GREATEST(
            ${query.endDate}::timestamptz,
            ${query.compareEndDate}::timestamptz
          ),
          ${query.endDate}::timestamptz
        )
      GROUP BY orders."customerId"
    `;

    return rows.map((row) => ({
      customerId: row.customerId,
      firstOrderAt: row.firstOrderAt,
      lastOrderAt: row.lastOrderAt,
      currentOrders: Number(row.currentOrders || 0),
      compareOrders: Number(row.compareOrders || 0),
    }));
  }

  async getCustomerRetentionDailyByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<CustomerRetentionDailyPoint[]> {
    const rows = await prisma.$queryRaw<CustomerRetentionDailyRow[]>`
      WITH bounds AS (
        SELECT
          date_trunc('day', timezone(${query.timezone}, ${query.startDate}::timestamptz))::date AS local_start_day,
          date_trunc('day', timezone(${query.timezone}, ${query.endDate}::timestamptz))::date AS local_end_day
      ),
      days AS (
        SELECT generate_series(
          (SELECT local_start_day FROM bounds),
          (SELECT local_end_day FROM bounds),
          interval '1 day'
        )::date AS local_day
      ),
      first_orders AS (
        SELECT
          orders."customerId" AS "customerId",
          MIN(orders."createdAt") AS "firstOrderAt"
        FROM "Order" orders
        INNER JOIN "Branch" branch
          ON branch."id" = orders."branchId"
        WHERE orders."canceled" = false
          AND orders."customerId" IS NOT NULL
          AND branch."businessId" = ${query.businessId}
        GROUP BY orders."customerId"
      ),
      daily_customer_activity AS (
        SELECT
          timezone(${query.timezone}, orders."createdAt")::date AS local_day,
          orders."customerId" AS "customerId"
        FROM "Order" orders
        INNER JOIN "Branch" branch
          ON branch."id" = orders."branchId"
        WHERE orders."canceled" = false
          AND orders."customerId" IS NOT NULL
          AND branch."businessId" = ${query.businessId}
          AND orders."createdAt" >= ${query.startDate}::timestamptz
          AND orders."createdAt" <= ${query.endDate}::timestamptz
        GROUP BY 1, 2
      ),
      daily_counts AS (
        SELECT
          daily_customer_activity.local_day,
          COUNT(*) FILTER (
            WHERE timezone(${query.timezone}, first_orders."firstOrderAt")::date = daily_customer_activity.local_day
          )::int AS "newCustomers",
          COUNT(*) FILTER (
            WHERE timezone(${query.timezone}, first_orders."firstOrderAt")::date < daily_customer_activity.local_day
          )::int AS "returningCustomers"
        FROM daily_customer_activity
        INNER JOIN first_orders
          ON first_orders."customerId" = daily_customer_activity."customerId"
        GROUP BY 1
      )
      SELECT
        to_char(days.local_day, 'YYYY-MM-DD') AS key,
        (days.local_day::timestamp AT TIME ZONE ${query.timezone}) AS "bucketStartAt",
        (((days.local_day + 1)::timestamp - interval '1 millisecond') AT TIME ZONE ${query.timezone}) AS "bucketEndAt",
        COALESCE(daily_counts."newCustomers", 0)::int AS "newCustomers",
        COALESCE(daily_counts."returningCustomers", 0)::int AS "returningCustomers"
      FROM days
      LEFT JOIN daily_counts
        ON daily_counts.local_day = days.local_day
      ORDER BY days.local_day ASC
    `;

    return rows.map((row) => ({
      key: row.key,
      bucketStartAt: row.bucketStartAt,
      bucketEndAt: row.bucketEndAt,
      newCustomers: Number(row.newCustomers || 0),
      returningCustomers: Number(row.returningCustomers || 0),
    }));
  }

  async getNewCustomersByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<NewCustomersBucketPoint[]> {
    const rows = await prisma.$queryRaw<NewCustomersRow[]>`
      WITH bounds AS (
        SELECT
          date_trunc('day', timezone(${query.timezone}, ${query.startDate}::timestamptz))::date AS local_start_day,
          date_trunc('day', timezone(${query.timezone}, ${query.endDate}::timestamptz))::date AS local_end_day
      ),
      days AS (
        SELECT generate_series(
          (SELECT local_start_day FROM bounds),
          (SELECT local_end_day FROM bounds),
          interval '1 day'
        )::date AS local_day
      ),
      first_orders AS (
        SELECT
          orders."customerId" AS "customerId",
          MIN(orders."createdAt") AS "firstOrderAt"
        FROM "Order" orders
        INNER JOIN "Branch" branch
          ON branch."id" = orders."branchId"
        WHERE orders."canceled" = false
          AND orders."customerId" IS NOT NULL
          AND branch."businessId" = ${query.businessId}
        GROUP BY orders."customerId"
      ),
      customers_agg AS (
        SELECT
          timezone(${query.timezone}, first_orders."firstOrderAt")::date AS local_day,
          COUNT(*)::int AS customers
        FROM first_orders
        WHERE first_orders."firstOrderAt" >= ${query.startDate}::timestamptz
          AND first_orders."firstOrderAt" <= ${query.endDate}::timestamptz
        GROUP BY 1
      )
      SELECT
        to_char(days.local_day, 'YYYY-MM-DD') AS key,
        (days.local_day::timestamp AT TIME ZONE ${query.timezone}) AS "bucketStartAt",
        (((days.local_day + 1)::timestamp - interval '1 millisecond') AT TIME ZONE ${query.timezone}) AS "bucketEndAt",
        COALESCE(customers_agg.customers, 0)::int AS customers
      FROM days
      LEFT JOIN customers_agg
        ON customers_agg.local_day = days.local_day
      ORDER BY days.local_day ASC
    `;

    return rows.map((row) => ({
      key: row.key,
      bucketStartAt: row.bucketStartAt,
      bucketEndAt: row.bucketEndAt,
      customers: Number(row.customers || 0),
    }));
  }

  async getOrderQuantityByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<OrderQuantityBucketPoint[]> {
    const rows = await prisma.$queryRaw<OrderQuantityRow[]>`
      WITH bounds AS (
        SELECT
          date_trunc('day', timezone(${query.timezone}, ${query.startDate}::timestamptz))::date AS local_start_day,
          date_trunc('day', timezone(${query.timezone}, ${query.endDate}::timestamptz))::date AS local_end_day
      ),
      days AS (
        SELECT generate_series(
          (SELECT local_start_day FROM bounds),
          (SELECT local_end_day FROM bounds),
          interval '1 day'
        )::date AS local_day
      ),
      orders_agg AS (
        SELECT
          timezone(${query.timezone}, orders."createdAt")::date AS local_day,
          COUNT(*)::int AS orders
        FROM "Order" orders
        INNER JOIN "Branch" branch
          ON branch."id" = orders."branchId"
        WHERE orders."canceled" = false
          AND branch."businessId" = ${query.businessId}
          AND orders."createdAt" >= ${query.startDate}::timestamptz
          AND orders."createdAt" <= ${query.endDate}::timestamptz
        GROUP BY 1
      )
      SELECT
        to_char(days.local_day, 'YYYY-MM-DD') AS key,
        (days.local_day::timestamp AT TIME ZONE ${query.timezone}) AS "bucketStartAt",
        (((days.local_day + 1)::timestamp - interval '1 millisecond') AT TIME ZONE ${query.timezone}) AS "bucketEndAt",
        COALESCE(orders_agg.orders, 0)::int AS orders
      FROM days
      LEFT JOIN orders_agg
        ON orders_agg.local_day = days.local_day
      ORDER BY days.local_day ASC
    `;

    return rows.map((row) => ({
      key: row.key,
      bucketStartAt: row.bucketStartAt,
      bucketEndAt: row.bucketEndAt,
      orders: Number(row.orders || 0),
    }));
  }

  async getRevenueByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<RevenueBucketPoint[]> {
    const rows = await prisma.$queryRaw<RevenueRow[]>`
      WITH bounds AS (
        SELECT
          date_trunc('day', timezone(${query.timezone}, ${query.startDate}::timestamptz))::date AS local_start_day,
          date_trunc('day', timezone(${query.timezone}, ${query.endDate}::timestamptz))::date AS local_end_day
      ),
      days AS (
        SELECT generate_series(
          (SELECT local_start_day FROM bounds),
          (SELECT local_end_day FROM bounds),
          interval '1 day'
        )::date AS local_day
      ),
      order_totals AS (
        SELECT
          orders."id" AS "orderId",
          timezone(${query.timezone}, orders."createdAt")::date AS local_day,
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
          AND orders."createdAt" >= ${query.startDate}::timestamptz
          AND orders."createdAt" <= ${query.endDate}::timestamptz
        GROUP BY
          orders."id",
          timezone(${query.timezone}, orders."createdAt")::date,
          orders."progressiveDiscountSnapshot"
      ),
      orders_agg AS (
        SELECT
          order_totals.local_day,
          COUNT(*)::int AS orders,
          COALESCE(
            SUM(
              GREATEST(0, order_totals.discounted_subtotal_cents)
              + GREATEST(0, order_totals.delivery_fee_cents)
            ),
            0
          )::bigint::text AS sales
        FROM order_totals
        GROUP BY order_totals.local_day
      )
      SELECT
        to_char(days.local_day, 'YYYY-MM-DD') AS key,
        (days.local_day::timestamp AT TIME ZONE ${query.timezone}) AS "bucketStartAt",
        (((days.local_day + 1)::timestamp - interval '1 millisecond') AT TIME ZONE ${query.timezone}) AS "bucketEndAt",
        COALESCE(orders_agg.orders, 0)::int AS orders,
        COALESCE(orders_agg.sales, '0') AS sales
      FROM days
      LEFT JOIN orders_agg
        ON orders_agg.local_day = days.local_day
      ORDER BY days.local_day ASC
    `;

    return rows.map((row) => ({
      key: row.key,
      bucketStartAt: row.bucketStartAt,
      bucketEndAt: row.bucketEndAt,
      orders: Number(row.orders || 0),
      sales: Number(row.sales || "0"),
    }));
  }

  async getOrderSalesByDateRange(
    query: OrderSalesRangeQuery,
  ): Promise<OrderSalesDailyPoint[]> {
    const rows = await prisma.$queryRaw<DailyRow[]>`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', ${query.from}::timestamptz)::date,
          date_trunc('day', ${query.to}::timestamptz)::date,
          interval '1 day'
        )::date AS day
      ),
      order_totals AS (
        SELECT
          orders."id" AS "orderId",
          date_trunc('day', orders."createdAt" AT TIME ZONE 'UTC')::date AS day,
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
          AND orders."createdAt" >= ${query.from}::timestamptz
          AND orders."createdAt" <= ${query.to}::timestamptz
        GROUP BY
          orders."id",
          date_trunc('day', orders."createdAt" AT TIME ZONE 'UTC')::date,
          orders."progressiveDiscountSnapshot"
      ),
      orders_agg AS (
        SELECT
          order_totals.day,
          COUNT(*)::int AS orders,
          COALESCE(
            SUM(
              GREATEST(0, order_totals.discounted_subtotal_cents)
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
