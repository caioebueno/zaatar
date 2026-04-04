"use server";

import prisma from "@/prisma";
import { TOrder } from "./types/order";

const getOrder = async (orderId: string): Promise<TOrder> => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });
  if (!order)
    throw {
      code: "NOT_FOUND",
      details: {
        service: "ORDER",
        id: orderId,
      },
    };
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    type: order.type,
    number: order.number || undefined,
    paymentMethod: order.paymentMethod,
    orderProducts: [],
    preparationStepCategory: [],
  };
};

export default getOrder;
