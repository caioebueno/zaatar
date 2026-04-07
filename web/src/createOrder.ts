"use server";

import { after } from "next/server";
import { MAX_DELIVERY_FEE_CENTS } from "@/utils/calculateDeliveryFee";
import prisma from "../prisma";
import TCart from "../types/cart";
import getProgressiveDiscount from "./getProgressiveDiscount";
import { randomUUID } from "crypto";
import {
  TOrder,
  TOrderProduct,
  TOrderType,
  TPaymentMethod,
} from "./types/order";
import { calculateProductPriceWithProgressiveDiscount } from "../utils/calculateProductPriceWithProgressiveDiscount";
import getProducts from "./getProducts";
import { createOrderPreparationStepsUseCase } from "@/src/modules/station/application/createOrderPreparationSteps";
import { prismaStationRepository } from "@/src/modules/station/infrastructure/prisma/prismaStationRepository";
import {
  enqueueAssignDeliveryOrderToDispatch,
  processDispatchAssignmentJobs,
} from "@/src/modules/dispatch/application/assignDeliveryOrderToDispatchQueue";

type TCreateOrder = {
  cart: TCart;
  customerId: string;
  orderType: TOrderType;
  paymentMethod: TPaymentMethod;
  tipAmount?: number;
  addressId?: string;
  cupom?: string;
};

const createOrder = async (data: TCreateOrder): Promise<TOrder> => {
  if (!data.addressId && data.orderType === "DELIVERY")
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "DELIVERY_MUST_HAVE_ADDRESS",
      },
    };
  if (data.addressId && data.orderType === "DELIVERY") {
    const deliveryAddress = await prisma.$queryRaw<
      { deliveryFee: number }[]
    >`
      SELECT "deliveryFee"
      FROM "DeliveryAddress"
      WHERE "id" = ${data.addressId}
      LIMIT 1
    `;

    if (deliveryAddress.length === 0) {
      throw {
        code: "INVALID_PARAMS",
        data: {
          message: "DELIVERY_MUST_HAVE_ADDRESS",
        },
      };
    }

    if (deliveryAddress[0].deliveryFee > MAX_DELIVERY_FEE_CENTS) {
      throw {
        code: "INVALID_PARAMS",
        data: {
          message: "OUTSIDE_DELIVERY_COVERAGE_AREA",
        },
      };
    }
  }
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  const todayOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  const progressiveDiscount = await getProgressiveDiscount();
  const productData = await getProducts();
  const createdOrder = await prisma.order.create({
    data: {
      id: randomUUID(),
      amount: 0,
      number: (todayOrders.length + 1).toString(),
      deliveryAddressId: data.addressId,
      customerId: data.customerId,
      paymentMethod: data.paymentMethod,
      tipAmount: data.tipAmount,
      type: data.orderType,
    },
    include: {
      orderProducts: {
        include: {
          product: true,
        },
      },
    },
  });
  const prismaOrderProducts: ({
    product: {
      id: string;
      name: string;
      createdAt: Date;
      price: number | null;
      categoryId: string | null;
      description: string | null;
      comparedAtPrice: number | null;
      translations: any;
    };
    modifierGroupItems: {
      id: string;
      name: string;
      createdAt: Date;
      price: number;
      modifierGroupId: string | null;
      fileId: string | null;
    }[];
  } & {
    id: string;
    comments: string | null;
    createdAt: Date;
    quantity: number;
    fullAmount: number;
    amount: number;
    productId: string;
  })[] = [];
  for (const item of data.cart.items) {
    const price = calculateProductPriceWithProgressiveDiscount(
      item.productId,
      progressiveDiscount,
      data.cart,
      productData.categories,
    );
    if (!price)
      throw {
        code: "ERROR_CALCULATING_PRICE",
        data: {
          productId: item.productId,
        },
      };
    const createdOrderProduct = await prisma.orderProducts.create({
      data: {
        id: randomUUID(),
        amount: price.actualPrice,
        productId: item.productId,
        orderId: createdOrder.id,
        fullAmount: price.fullPrice,
        quantity: item.quantity,
        comments: item.description,
        modifierGroupItems: {
          connect: item.modifiers.map((modItem) => ({
            id: modItem.modifierItemId,
          })),
        },
      },
      include: {
        modifierGroupItems: true,
        product: true,
      },
    });
    prismaOrderProducts.push(createdOrderProduct);
  }
  const orderProducts: TOrderProduct[] = prismaOrderProducts.map((item) => ({
    id: item.id,
    amount: item.amount,
    fullAmount: item.fullAmount,
    productId: item.productId,
    quantity: item.quantity,
    comments: item.comments || undefined,
    selectedModifierGroupItemIds: item.modifierGroupItems.map(
      (item) => item.id,
    ),
    product: {
      id: item.product.id,
      name: item.product.name,
      categoryId: item.product.categoryId || undefined,
      preparationStep: [],
    },
  }));
  const order: TOrder = {
    id: createdOrder.id,
    createdAt: createdOrder.createdAt.toISOString(),
    paidAt: null,
    status: "ACCEPTED",
    orderProducts: orderProducts,
    paymentMethod: createdOrder.paymentMethod,
    type: createdOrder.type,
    preparationStepCategory: [],
  };
  await createOrderPreparationStepsUseCase(prismaStationRepository, order);

  if (data.orderType === "DELIVERY" && data.addressId) {
    await enqueueAssignDeliveryOrderToDispatch({
      orderId: createdOrder.id,
      deliveryAddressId: data.addressId,
    });

    after(async () => {
      await processDispatchAssignmentJobs(1).catch((error: unknown) => {
        console.error("Failed to trigger dispatch assignment processing:", error);
      });
    });
  }

  return order;
};

export default createOrder;
