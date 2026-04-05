"use server";

import prisma from "@/prisma";
import { TOrder, TOrderStatus, TOrderType, TPaymentMethod } from "./types/order";

type OrderRow = {
  id: string;
  createdAt: Date;
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
      o."number",
      o."status",
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
      o."number",
      o."status",
      o."type",
      o."paymentMethod",
      o."amount",
      o."tipAmount",
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
  const computedTotal = subtotalAmount + tipAmount + deliveryFee;
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

  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    type: order.type,
    number: order.number || undefined,
    totalAmount: amount > 0 ? amount : computedTotal,
    subtotalAmount,
    tipAmount,
    deliveryFee,
    paymentMethod: order.paymentMethod,
    orderProducts: orderProducts.map((item) => ({
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
        description: undefined,
        price: modifierItem.price,
      })),
      amount: item.amount,
      fullAmount: item.fullAmount,
      quantity: item.quantity,
    })),
    preparationStepCategory: [],
  };
};

export default getOrder;
