"use server";

import prisma from "@/prisma";
import { TOrder, TOrderStatus, TOrderType, TPaymentMethod } from "./types/order";
import { calculateSalesTaxInCents } from "@/src/constants/pricing";

type OrderRow = {
  id: string;
  createdAt: Date;
  scheduleFor: Date | null;
  language: string | null;
  paidAt: Date | null;
  deliveredAt: Date | null;
  estimatedDeliveryDurationMinutes: number | null;
  progressiveDiscountSnapshot: unknown | null;
  dispatchOrderIndex: number | null;
  number: string | null;
  status: TOrderStatus;
  type: TOrderType;
  paymentMethod: TPaymentMethod;
  amount: number | bigint;
  tipAmount: number | bigint | null;
  deliveryFee: number | bigint | null;
  subtotalAmount: number | bigint | null;
};

const toNumber = (value: number | bigint | null | undefined): number =>
  typeof value === "bigint" ? Number(value) : value ?? 0;

const getOrder = async (orderId: string): Promise<TOrder> => {
  const [order] = await prisma.$queryRaw<OrderRow[]>`
    SELECT
      o."id",
      o."createdAt",
      o."scheduleFor",
      o."language",
      o."paidAt",
      o."deliveredAt",
      o."estimatedDeliveryDurationMinutes",
      o."progressiveDiscountSnapshot",
      o."dispatchOrderIndex",
      o."number",
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
      END AS "status",
      o."type",
      o."paymentMethod",
      o."amount",
      o."tipAmount",
      da."deliveryFee",
      COALESCE(SUM(op."amount" * op."quantity"), 0) AS "subtotalAmount"
    FROM "Order" o
    LEFT JOIN "OrderProducts" op ON op."orderId" = o."id"
    LEFT JOIN "DeliveryAddress" da ON da."id" = o."deliveryAddressId"
    WHERE o."id" = ${orderId}
    GROUP BY
      o."id",
      o."createdAt",
      o."scheduleFor",
      o."language",
      o."paidAt",
      o."deliveredAt",
      o."estimatedDeliveryDurationMinutes",
      o."progressiveDiscountSnapshot",
      o."dispatchOrderIndex",
      o."number",
      o."type",
      o."paymentMethod",
      o."amount",
      o."tipAmount",
      o."dispatchId",
      da."deliveryFee"
    LIMIT 1
  `;
  if (!order)
    throw {
      code: "NOT_FOUND",
      details: {
        service: "ORDER",
        id: orderId,
      },
    };
  const amount = toNumber(order.amount);
  const tipAmount = toNumber(order.tipAmount);
  const deliveryFee = toNumber(order.deliveryFee);
  const subtotalAmount = toNumber(order.subtotalAmount);
  const progressiveDiscountSnapshot =
    order.progressiveDiscountSnapshot &&
    typeof order.progressiveDiscountSnapshot === "object"
      ? (order.progressiveDiscountSnapshot as TOrder["progressiveDiscountSnapshot"])
      : undefined;
  const subtotalForTipCalculation =
    progressiveDiscountSnapshot?.discountedPrice ?? subtotalAmount;
  const computedTipAmount = Math.round(
    (subtotalForTipCalculation * tipAmount) / 100,
  );
  const salesTaxAmount = calculateSalesTaxInCents(subtotalForTipCalculation);
  const computedTotal =
    subtotalForTipCalculation + computedTipAmount + deliveryFee + salesTaxAmount;
  const orderProducts = await prisma.orderProducts.findMany({
    where: {
      orderId,
    },
    include: {
      product: true,
      modifierGroupItems: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  type OrderProductWithModifierTranslations = (typeof orderProducts)[number] & {
    modifierGroupItems: {
      id: string;
      name: string;
      description: string | null;
      price: number;
      translations: unknown;
    }[];
  };
  const orderProductsWithTranslations =
    orderProducts as unknown as OrderProductWithModifierTranslations[];

  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    scheduleFor: order.scheduleFor ? order.scheduleFor.toISOString() : null,
    language: order.language,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    ...(progressiveDiscountSnapshot ? { progressiveDiscountSnapshot } : {}),
    ...(order.deliveredAt ? { deliveredAt: order.deliveredAt.toISOString() } : {}),
    estimatedDeliveryDurationMinutes: order.estimatedDeliveryDurationMinutes,
    ...(order.dispatchOrderIndex !== null
      ? { dispatchOrderIndex: order.dispatchOrderIndex }
      : {}),
    status: order.status,
    type: order.type,
    number: order.number || undefined,
    totalAmount: amount > 0 ? amount : computedTotal,
    subtotalAmount,
    tipAmount,
    deliveryFee,
    paymentMethod: order.paymentMethod,
    orderProducts: orderProductsWithTranslations.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        categoryId: item.product.categoryId,
        comparedAtPrice: item.product.comparedAtPrice,
        translations:
          item.product.translations &&
          typeof item.product.translations === "object"
            ? (item.product.translations as {
                [key: string]: {
                  [key: string]: string;
                };
              })
            : undefined,
      },
      comments: item.comments || undefined,
      selectedModifierGroupItemIds: item.modifierGroupItems.map(
        (modifierItem) => modifierItem.id,
      ),
      selectedModifierGroupItems: item.modifierGroupItems.map((modifierItem) => ({
        id: modifierItem.id,
        name: modifierItem.name,
        description: modifierItem.description || undefined,
        price: modifierItem.price,
        translations:
          modifierItem.translations &&
          typeof modifierItem.translations === "object"
            ? (modifierItem.translations as {
                [key: string]: {
                  [key: string]: string;
                };
              })
            : undefined,
      })),
      amount: item.amount,
      fullAmount: item.fullAmount,
      quantity: item.quantity,
    })),
    preparationStepCategory: [],
  };
};

export default getOrder;
