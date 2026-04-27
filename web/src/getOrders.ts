"use server";

import prisma from "@/prisma";
import { calculateSalesTaxInCents } from "@/src/constants/pricing";
import type { TOrderStatus, TOrderType, TPaymentMethod } from "@/src/types/order";

type OrderListRow = {
  id: string;
  createdAt: Date;
  scheduleFor: Date | null;
  number: string | null;
  externalId: string | null;
  canceled: boolean;
  type: TOrderType;
  paymentMethod: TPaymentMethod;
  status: TOrderStatus;
  amount: number | bigint;
  tipAmount: number | bigint | null;
  deliveryFee: number | bigint | null;
  subtotalAmount: number | bigint | null;
  itemCount: number | bigint;
  customerName: string | null;
  language: string | null;
  progressiveDiscountSnapshot: unknown | null;
};

export type TOrderListItem = {
  id: string;
  createdAt: string;
  scheduleFor: string | null;
  number: string | null;
  externalId: string | null;
  canceled: boolean;
  type: TOrderType;
  paymentMethod: TPaymentMethod;
  status: TOrderStatus;
  customerName: string | null;
  language: string | null;
  itemCount: number;
  subtotalAmount: number;
  deliveryFee: number;
  tip: number;
  taxAmount: number;
  totalAmount: number;
};

const toNumber = (value: number | bigint | null | undefined): number =>
  typeof value === "bigint" ? Number(value) : value ?? 0;

const getOrders = async (): Promise<TOrderListItem[]> => {
  const rows = await prisma.$queryRaw<OrderListRow[]>`
    SELECT
      o."id",
      o."createdAt",
      o."scheduleFor",
      o."number",
      o."externalId",
      o."canceled",
      o."type",
      o."paymentMethod",
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
          SELECT 1
          FROM "Dispatch" dispatch
          WHERE dispatch."id" = o."dispatchId"
            AND dispatch."dispatched" = true
        ) THEN 'DELIVERING'
        WHEN EXISTS (
          SELECT 1
          FROM "PreparationStepCategory" preparationStepCategory
          INNER JOIN "PreparationStepTrack" preparationStepTrack
            ON preparationStepTrack."preparationStepCategoryId" = preparationStepCategory."id"
          WHERE preparationStepCategory."orderId" = o."id"
            AND preparationStepTrack."completed" = true
        ) THEN 'PREPARING'
        ELSE 'ACCEPTED'
      END AS "status"
    FROM "Order" o
    LEFT JOIN "OrderProducts" op ON op."orderId" = o."id"
    LEFT JOIN "DeliveryAddress" da ON da."id" = o."deliveryAddressId"
    LEFT JOIN "Customer" customer ON customer."id" = o."customerId"
    GROUP BY
      o."id",
      o."createdAt",
      o."scheduleFor",
      o."number",
      o."externalId",
      o."canceled",
      o."type",
      o."paymentMethod",
      o."language",
      o."amount",
      o."tipAmount",
      o."progressiveDiscountSnapshot",
      o."dispatchId",
      o."deliveredAt",
      da."deliveryFee",
      customer."name"
    ORDER BY o."createdAt" DESC
  `;

  return rows.map((row) => {
    const amount = toNumber(row.amount);
    const rawSubtotal = toNumber(row.subtotalAmount);
    const tipPercent = toNumber(row.tipAmount);
    const deliveryFee = toNumber(row.deliveryFee);
    const progressiveDiscountSnapshot =
      row.progressiveDiscountSnapshot &&
      typeof row.progressiveDiscountSnapshot === "object"
        ? (row.progressiveDiscountSnapshot as { discountedPrice?: unknown })
        : undefined;
    const discountedSubtotalFromSnapshot =
      typeof progressiveDiscountSnapshot?.discountedPrice === "number"
        ? progressiveDiscountSnapshot.discountedPrice
        : undefined;
    const discountedSubtotal =
      discountedSubtotalFromSnapshot !== undefined
        ? discountedSubtotalFromSnapshot
        : rawSubtotal;
    const tipAmount = Math.round((Math.max(discountedSubtotal, 0) * tipPercent) / 100);
    const taxAmount = calculateSalesTaxInCents(discountedSubtotal);
    const computedTotal =
      Math.max(discountedSubtotal, 0) + deliveryFee + tipAmount + taxAmount;

    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      scheduleFor: row.scheduleFor ? row.scheduleFor.toISOString() : null,
      number: row.number,
      externalId: row.externalId,
      canceled: row.canceled,
      type: row.type,
      paymentMethod: row.paymentMethod,
      status: row.status,
      customerName: row.customerName,
      language: row.language,
      itemCount: toNumber(row.itemCount),
      subtotalAmount: Math.max(discountedSubtotal, 0),
      deliveryFee,
      tip: tipAmount,
      taxAmount,
      totalAmount: amount > 0 ? amount : computedTotal,
    };
  });
};

export default getOrders;
