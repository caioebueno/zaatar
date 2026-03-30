"use server";

import prisma from "../prisma";
import TCart from "../types/cart";
import getProgressiveDiscount from "./getProgressiveDiscount";
import { randomUUID } from "crypto";
import { TOrder, TOrderType, TPaymentMethod } from "./types/order";
import { calculateProductPriceWithProgressiveDiscount } from "../utils/calculateProductPriceWithProgressiveDiscount";
import getProducts from "./getProducts";

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
      orderProducts: {
        createMany: {
          data: data.cart.items.map((item) => {
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
            return {
              id: randomUUID(),
              amount: price.actualPrice,
              productId: item.productId,
              fullAmount: price.fullPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
    },
  });
  return {
    id: createdOrder.id,
    createdAt: createdOrder.createdAt.toISOString(),
    orderProducts: [],
    paymentMethod: createdOrder.paymentMethod,
    type: createdOrder.type,
  };
};

export default createOrder;
