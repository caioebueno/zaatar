"use server";

import prisma from "@/prisma";
import { calculateSalesTaxInCents } from "@/src/constants/pricing";
import type { TOrderListItem } from "@/src/getOrders";

const FLORIDA_TZ = "America/New_York";

const toNumber = (value: number | bigint | null | undefined): number =>
  typeof value === "bigint" ? Number(value) : value ?? 0;

const getTodayOrders = async (): Promise<TOrderListItem[]> => {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      createdAt: Date;
      scheduleFor: Date | null;
      number: string | null;
      externalId: string | null;
      canceled: boolean;
      type: string;
      paymentMethod: string;
      paymentProvider: string | null;
      status: string;
      amount: number | bigint;
      tipAmount: number | bigint | null;
      deliveryFee: number | bigint | null;
      subtotalAmount: number | bigint | null;
      itemCount: number | bigint;
      customerName: string | null;
      language: string | null;
      progressiveDiscountSnapshot: unknown | null;
    }>
  >`
    SELECT
      o."id",
      o."createdAt",
      o."scheduleFor",
      o."number",
      o."externalId",
      o."canceled",
      o."type",
      o."paymentMethod",
      o."paymentProvider",
      o."language",
      o."amount",
      o."tipAmount",
      o."progressiveDiscountSnapshot",
      customer."name" AS "customerName",
      da."deliveryFee",
      COALESCE(SUM(op."amount" * op."quantity"), 0) AS "subtotalAmount",
      COALESCE(SUM(op."quantity"), 0) AS "itemCount",
      CASE
        WHEN o."deliveredAt" IS NOT NULL THEN 'DELIVERED'
        WHEN EXISTS (
          SELECT 1 FROM "Dispatch" d
          WHERE d."id" = o."dispatchId" AND d."dispatched" = true
        ) THEN 'DELIVERING'
        WHEN EXISTS (
          SELECT 1
          FROM "PreparationStepCategory" psc
          INNER JOIN "PreparationStepTrack" pst ON pst."preparationStepCategoryId" = psc."id"
          WHERE psc."orderId" = o."id" AND pst."completed" = true
        ) THEN 'PREPARING'
        ELSE 'ACCEPTED'
      END AS "status"
    FROM "Order" o
    LEFT JOIN "OrderProducts" op ON op."orderId" = o."id"
    LEFT JOIN "DeliveryAddress" da ON da."id" = o."deliveryAddressId"
    LEFT JOIN "Customer" customer ON customer."id" = o."customerId"
    WHERE (o."createdAt" AT TIME ZONE ${FLORIDA_TZ})::date
        = (now() AT TIME ZONE ${FLORIDA_TZ})::date
    GROUP BY
      o."id", o."createdAt", o."scheduleFor", o."number", o."externalId",
      o."canceled", o."type", o."paymentMethod", o."paymentProvider",
      o."language", o."amount", o."tipAmount", o."progressiveDiscountSnapshot",
      o."dispatchId", o."deliveredAt", da."deliveryFee", customer."name"
    ORDER BY o."createdAt" DESC
  `;

  return rows.map((row) => {
    const rawSubtotal = toNumber(row.subtotalAmount);
    const tipPercent = toNumber(row.tipAmount);
    const deliveryFee = toNumber(row.deliveryFee);
    const amount = toNumber(row.amount);

    const snapshot =
      row.progressiveDiscountSnapshot &&
      typeof row.progressiveDiscountSnapshot === "object"
        ? (row.progressiveDiscountSnapshot as { discountedPrice?: unknown })
        : undefined;
    const discountedSubtotal =
      typeof snapshot?.discountedPrice === "number"
        ? snapshot.discountedPrice
        : rawSubtotal;

    const subtotal = Math.max(discountedSubtotal, 0);
    const tip = Math.round((subtotal * tipPercent) / 100);
    const tax = calculateSalesTaxInCents(subtotal);

    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      scheduleFor: row.scheduleFor ? row.scheduleFor.toISOString() : null,
      number: row.number,
      externalId: row.externalId,
      canceled: row.canceled,
      type: row.type as TOrderListItem["type"],
      paymentMethod: row.paymentMethod as TOrderListItem["paymentMethod"],
      paymentProvider: row.paymentProvider as TOrderListItem["paymentProvider"],
      status: row.status as TOrderListItem["status"],
      customerName: row.customerName,
      language: row.language,
      itemCount: toNumber(row.itemCount),
      subtotalAmount: subtotal,
      deliveryFee,
      tip,
      taxAmount: tax,
      totalAmount: amount > 0 ? amount : subtotal + deliveryFee + tip + tax,
    };
  });
};

export default getTodayOrders;
