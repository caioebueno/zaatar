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
import { calculateCartWithProgressiveDiscount } from "../utils/calculatePrice";
import getProducts from "./getProducts";
import { createOrderPreparationStepsUseCase } from "@/src/modules/station/application/createOrderPreparationSteps";
import { prismaStationRepository } from "@/src/modules/station/infrastructure/prisma/prismaStationRepository";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";
import {
  enqueueAssignDeliveryOrderToDispatch,
  processDispatchAssignmentJobs,
} from "@/src/modules/dispatch/application/assignDeliveryOrderToDispatchQueue";

type TCreateOrder = {
  cart: TCart;
  customerId: string;
  orderType: TOrderType;
  paymentMethod: TPaymentMethod;
  scheduleFor?: string;
  selectedPrize?: {
    prizeId: string;
    selectedProductIds: string[];
  };
  tipAmount?: number;
  addressId?: string;
  cupom?: string;
};

function ensureValidScheduleFor(value: unknown): Date | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_SCHEDULE_FOR",
      },
    };
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_SCHEDULE_FOR",
      },
    };
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_SCHEDULE_FOR",
      },
    };
  }

  return parsedDate;
}

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
  const scheduleFor = ensureValidScheduleFor(data.scheduleFor);
  const getCatalogProductById = (productId: string) => {
    for (const category of productData.categories) {
      const product = category.products.find((item) => item.id === productId);
      if (!product) continue;

      return {
        product,
        categoryId: category.id,
      };
    }

    return null;
  };
  const cartPricingSummary = calculateCartWithProgressiveDiscount(
    productData.categories,
    data.cart,
    progressiveDiscount,
  );
  const selectedPrizeSnapshot = (() => {
    if (!data.selectedPrize) return null;
    if (!progressiveDiscount) {
      throw {
        code: "INVALID_PARAMS",
        data: {
          message: "INVALID_SELECTED_PRIZE",
        },
      };
    }

    const availablePrizes = progressiveDiscount.steps.flatMap(
      (step) => step.prizes || [],
    );
    const selectedPrize = availablePrizes.find(
      (prize) => prize.id === data.selectedPrize?.prizeId,
    );

    if (!selectedPrize) {
      throw {
        code: "INVALID_PARAMS",
        data: {
          message: "INVALID_SELECTED_PRIZE",
        },
      };
    }

    const allowedProductIds = new Set(
      selectedPrize.products.map((product) => product.id),
    );
    const selectedProductIds = (data.selectedPrize.selectedProductIds || []).filter(
      (productId: string) => allowedProductIds.has(productId),
    );
    const requiredSelectionCount =
      selectedPrize.products.length > 0 ? selectedPrize.quantity : 0;

    if (requiredSelectionCount !== selectedProductIds.length) {
      throw {
        code: "INVALID_PARAMS",
        data: {
          message: "INVALID_SELECTED_PRIZE_PRODUCTS",
        },
      };
    }

    const selectedProductCountsMap = new Map<string, number>();
    for (const productId of selectedProductIds) {
      selectedProductCountsMap.set(
        productId,
        (selectedProductCountsMap.get(productId) || 0) + 1,
      );
    }

    return {
      prizeId: selectedPrize.id,
      prizeName: selectedPrize.name,
      quantity: selectedPrize.quantity,
      selectedProductIds,
      selectedProductCounts: Array.from(selectedProductCountsMap.entries()).map(
        ([productId, quantity]) => ({
          productId,
          quantity,
        }),
      ),
      availableProducts: JSON.parse(JSON.stringify(selectedPrize.products)),
    };
  })();
  const progressiveDiscountSnapshot = progressiveDiscount
    ? {
        progressiveDiscount: JSON.parse(JSON.stringify(progressiveDiscount)),
        appliedStep: cartPricingSummary.appliedStep
          ? JSON.parse(JSON.stringify(cartPricingSummary.appliedStep))
          : null,
        fullPrice: cartPricingSummary.fullPrice,
        discountedPrice: cartPricingSummary.discountedPrice,
        discountAmount: cartPricingSummary.discountAmount,
        selectedPrize: selectedPrizeSnapshot,
      }
    : null;
  const createdOrder = await prisma.order.create({
    data: {
      id: randomUUID(),
      amount: 0,
      number: (todayOrders.length + 1).toString(),
      deliveryAddressId:
        data.orderType === "DELIVERY" ? data.addressId : undefined,
      customerId: data.customerId,
      paymentMethod: data.paymentMethod,
      tipAmount: data.tipAmount,
      progressiveDiscountSnapshot: progressiveDiscountSnapshot || undefined,
      type: data.orderType,
    },
  });
  if (scheduleFor) {
    await prisma.$executeRaw`
      UPDATE "Order"
      SET "scheduleFor" = ${scheduleFor}
      WHERE "id" = ${createdOrder.id}
    `;
  }
  for (const item of data.cart.items) {
    const price = calculateProductPriceWithProgressiveDiscount(
      item.productId,
      progressiveDiscount,
      data.cart,
      productData.categories,
      { cartItem: item },
    );
    if (!price)
      throw {
        code: "ERROR_CALCULATING_PRICE",
        data: {
          productId: item.productId,
        },
      };
    await prisma.orderProducts.create({
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
    });
  }

  type CreatedOrderProductRow = {
    id: string;
    comments: string | null;
    quantity: number;
    fullAmount: number;
    amount: number;
    productId: string;
    product: {
      id: string;
      name: string;
      createdAt: Date;
      price: number | null;
      categoryId: string | null;
      description: string | null;
      comparedAtPrice: number | null;
      translations: unknown;
    };
    modifierGroupItems: {
      id: string;
      name: string;
      createdAt: Date;
      price: number;
      modifierGroupId: string | null;
      fileId: string | null;
    }[];
  };

  const createdOrderProducts = (await prisma.orderProducts.findMany({
    where: {
      orderId: createdOrder.id,
    },
    include: {
      modifierGroupItems: true,
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })) as unknown as CreatedOrderProductRow[];

  const orderProducts: TOrderProduct[] = createdOrderProducts.map((item) => ({
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
  const prizePreparationOrderProducts: TOrderProduct[] = [];
  if (selectedPrizeSnapshot) {
    for (const selectedPrizeProduct of selectedPrizeSnapshot.selectedProductCounts) {
      if (selectedPrizeProduct.quantity <= 0) continue;

      const catalogProduct = getCatalogProductById(selectedPrizeProduct.productId);
      if (!catalogProduct) continue;

      const categoryId =
        catalogProduct.product.categoryId ?? catalogProduct.categoryId;
      if (!categoryId) continue;

      prizePreparationOrderProducts.push({
        id: randomUUID(),
        amount: 0,
        fullAmount: 0,
        productId: selectedPrizeProduct.productId,
        quantity: selectedPrizeProduct.quantity,
        selectedModifierGroupItemIds: [],
        product: {
          id: catalogProduct.product.id,
          name: catalogProduct.product.name,
          categoryId,
          translations: catalogProduct.product.translations,
          preparationStep: [],
        },
      });
    }
  }
  const order: TOrder = {
    id: createdOrder.id,
    createdAt: createdOrder.createdAt.toISOString(),
    scheduleFor: scheduleFor?.toISOString() ?? null,
    paidAt: null,
    status: "ACCEPTED",
    orderProducts: orderProducts,
    paymentMethod: createdOrder.paymentMethod,
    type: createdOrder.type,
    preparationStepCategory: [],
  };
  const orderForPreparationSteps =
    prizePreparationOrderProducts.length > 0
      ? {
          ...order,
          orderProducts: [...order.orderProducts, ...prizePreparationOrderProducts],
        }
      : order;
  await createOrderPreparationStepsUseCase(
    prismaStationRepository,
    orderForPreparationSteps,
  );

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
  } else if (data.orderType === "TAKEAWAY") {
    await prismaDispatchRepository.create({
      dispatched: false,
      driverId: null,
      orderIds: [createdOrder.id],
    });
  }

  return order;
};

export default createOrder;
