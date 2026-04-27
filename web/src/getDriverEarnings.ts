"use server";

import prisma from "@/prisma";

const FLORIDA_TIME_ZONE = "America/New_York";
const DRIVER_DAILY_BASE_PAY_CENTS = 3500;

type DriverDailyRow = {
  day: string;
  driverId: string;
  driverName: string;
  deliveries: string;
  deliveryFeesCents: string;
  basePayCents: string;
  totalCents: string;
};

type DriverSummaryRow = {
  driverId: string;
  driverName: string;
  active: boolean;
  priorityLevel: number;
  workDays: string;
  deliveries: string;
  deliveryFeesCents: string;
  basePayCents: string;
  totalCents: string;
};

type DriverDeliveryRow = {
  orderId: string;
  orderNumber: string | null;
  externalId: string | null;
  driverId: string;
  driverName: string;
  day: string;
  createdAtLocal: string;
  customerName: string | null;
  deliveryFeeCents: string;
};

export type DriverDailyEarnings = {
  day: string;
  driverId: string;
  driverName: string;
  deliveries: number;
  deliveryFeesCents: number;
  basePayCents: number;
  totalCents: number;
};

export type DriverSummaryEarnings = {
  driverId: string;
  driverName: string;
  active: boolean;
  priorityLevel: number;
  workDays: number;
  deliveries: number;
  deliveryFeesCents: number;
  basePayCents: number;
  totalCents: number;
};

export type DriverDeliveryEarnings = {
  orderId: string;
  orderNumber: string | null;
  externalId: string | null;
  driverId: string;
  driverName: string;
  day: string;
  createdAtLocal: string;
  customerName: string | null;
  deliveryFeeCents: number;
};

export type DriverEarningsReport = {
  timeZone: string;
  dailyBasePayCents: number;
  startDate: string;
  endDate: string;
  daily: DriverDailyEarnings[];
  drivers: DriverSummaryEarnings[];
  deliveries: DriverDeliveryEarnings[];
  totals: {
    workDays: number;
    deliveries: number;
    deliveryFeesCents: number;
    basePayCents: number;
    totalCents: number;
  };
};

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default async function getDriverEarnings(input: {
  startDate: string;
  endDate: string;
}): Promise<DriverEarningsReport> {
  const { startDate, endDate } = input;

  const dailyRows = await prisma.$queryRaw<DriverDailyRow[]>`
    WITH delivery_orders AS (
      SELECT
        dispatch."driverId" AS "driverId",
        driver."name" AS "driverName",
        (orders."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date AS day,
        COALESCE(delivery_address."deliveryFee", 0)::bigint AS "deliveryFeeCents"
      FROM "Order" orders
      INNER JOIN "Dispatch" dispatch ON dispatch."id" = orders."dispatchId"
      INNER JOIN "Driver" driver ON driver."id" = dispatch."driverId"
      LEFT JOIN "DeliveryAddress" delivery_address
        ON delivery_address."id" = orders."deliveryAddressId"
      WHERE orders."type" = 'DELIVERY'
        AND COALESCE(orders."canceled", false) = false
        AND orders."deliveredAt" IS NOT NULL
        AND (orders."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date
          BETWEEN ${startDate}::date AND ${endDate}::date
    )
    SELECT
      to_char(day, 'YYYY-MM-DD') AS day,
      "driverId",
      "driverName",
      COUNT(*)::text AS deliveries,
      COALESCE(SUM("deliveryFeeCents"), 0)::text AS "deliveryFeesCents",
      ${DRIVER_DAILY_BASE_PAY_CENTS}::text AS "basePayCents",
      (
        ${DRIVER_DAILY_BASE_PAY_CENTS}::bigint
        + COALESCE(SUM("deliveryFeeCents"), 0)
      )::text AS "totalCents"
    FROM delivery_orders
    GROUP BY day, "driverId", "driverName"
    ORDER BY day DESC, "driverName" ASC
  `;

  const summaryRows = await prisma.$queryRaw<DriverSummaryRow[]>`
    WITH delivery_orders AS (
      SELECT
        dispatch."driverId" AS "driverId",
        (orders."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date AS day,
        COALESCE(delivery_address."deliveryFee", 0)::bigint AS "deliveryFeeCents"
      FROM "Order" orders
      INNER JOIN "Dispatch" dispatch ON dispatch."id" = orders."dispatchId"
      LEFT JOIN "DeliveryAddress" delivery_address
        ON delivery_address."id" = orders."deliveryAddressId"
      WHERE orders."type" = 'DELIVERY'
        AND COALESCE(orders."canceled", false) = false
        AND orders."deliveredAt" IS NOT NULL
        AND (orders."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date
          BETWEEN ${startDate}::date AND ${endDate}::date
    ),
    summary AS (
      SELECT
        "driverId",
        COUNT(DISTINCT day)::bigint AS "workDays",
        COUNT(*)::bigint AS deliveries,
        COALESCE(SUM("deliveryFeeCents"), 0)::bigint AS "deliveryFeesCents"
      FROM delivery_orders
      GROUP BY "driverId"
    )
    SELECT
      driver."id" AS "driverId",
      driver."name" AS "driverName",
      driver."active" AS active,
      driver."priorityLevel" AS "priorityLevel",
      COALESCE(summary."workDays", 0)::text AS "workDays",
      COALESCE(summary.deliveries, 0)::text AS deliveries,
      COALESCE(summary."deliveryFeesCents", 0)::text AS "deliveryFeesCents",
      (
        COALESCE(summary."workDays", 0)::bigint
        * ${DRIVER_DAILY_BASE_PAY_CENTS}::bigint
      )::text AS "basePayCents",
      (
        (
          COALESCE(summary."workDays", 0)::bigint
          * ${DRIVER_DAILY_BASE_PAY_CENTS}::bigint
        )
        + COALESCE(summary."deliveryFeesCents", 0)::bigint
      )::text AS "totalCents"
    FROM "Driver" driver
    LEFT JOIN summary ON summary."driverId" = driver."id"
    ORDER BY driver."priorityLevel" ASC, driver."name" ASC
  `;

  const deliveryRows = await prisma.$queryRaw<DriverDeliveryRow[]>`
    SELECT
      orders."id" AS "orderId",
      orders."number" AS "orderNumber",
      orders."externalId" AS "externalId",
      dispatch."driverId" AS "driverId",
      driver."name" AS "driverName",
      to_char(
        (orders."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date,
        'YYYY-MM-DD'
      ) AS day,
      to_char(
        orders."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE},
        'YYYY-MM-DD HH24:MI'
      ) AS "createdAtLocal",
      customer."name" AS "customerName",
      COALESCE(delivery_address."deliveryFee", 0)::text AS "deliveryFeeCents"
    FROM "Order" orders
    INNER JOIN "Dispatch" dispatch ON dispatch."id" = orders."dispatchId"
    INNER JOIN "Driver" driver ON driver."id" = dispatch."driverId"
    LEFT JOIN "Customer" customer ON customer."id" = orders."customerId"
    LEFT JOIN "DeliveryAddress" delivery_address
      ON delivery_address."id" = orders."deliveryAddressId"
    WHERE orders."type" = 'DELIVERY'
      AND COALESCE(orders."canceled", false) = false
      AND orders."deliveredAt" IS NOT NULL
      AND (orders."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date
        BETWEEN ${startDate}::date AND ${endDate}::date
    ORDER BY
      orders."createdAt" DESC,
      driver."name" ASC
  `;

  const daily = dailyRows.map((row) => ({
    day: row.day,
    driverId: row.driverId,
    driverName: row.driverName,
    deliveries: toNumber(row.deliveries),
    deliveryFeesCents: toNumber(row.deliveryFeesCents),
    basePayCents: toNumber(row.basePayCents),
    totalCents: toNumber(row.totalCents),
  }));

  const drivers = summaryRows.map((row) => ({
    driverId: row.driverId,
    driverName: row.driverName,
    active: row.active,
    priorityLevel: row.priorityLevel,
    workDays: toNumber(row.workDays),
    deliveries: toNumber(row.deliveries),
    deliveryFeesCents: toNumber(row.deliveryFeesCents),
    basePayCents: toNumber(row.basePayCents),
    totalCents: toNumber(row.totalCents),
  }));

  const deliveries = deliveryRows.map((row) => ({
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    externalId: row.externalId,
    driverId: row.driverId,
    driverName: row.driverName,
    day: row.day,
    createdAtLocal: row.createdAtLocal,
    customerName: row.customerName,
    deliveryFeeCents: toNumber(row.deliveryFeeCents),
  }));

  const totals = drivers.reduce(
    (acc, row) => ({
      workDays: acc.workDays + row.workDays,
      deliveries: acc.deliveries + row.deliveries,
      deliveryFeesCents: acc.deliveryFeesCents + row.deliveryFeesCents,
      basePayCents: acc.basePayCents + row.basePayCents,
      totalCents: acc.totalCents + row.totalCents,
    }),
    {
      workDays: 0,
      deliveries: 0,
      deliveryFeesCents: 0,
      basePayCents: 0,
      totalCents: 0,
    },
  );

  return {
    timeZone: FLORIDA_TIME_ZONE,
    dailyBasePayCents: DRIVER_DAILY_BASE_PAY_CENTS,
    startDate,
    endDate,
    daily,
    drivers,
    deliveries,
    totals,
  };
}
