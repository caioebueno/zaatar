"use server";

import { after } from "next/server";
import { MAX_DELIVERY_FEE_CENTS } from "@/utils/calculateDeliveryFee";
import prisma from "../prisma";
import TCart from "../types/cart";
import getProgressiveDiscount from "./getProgressiveDiscount";
import { randomUUID } from "crypto";
import { Prisma } from "@/src/generated/prisma";
import {
  TOrder,
  TOrderProduct,
  TOrderType,
  TPaymentMethod,
} from "./types/order";
import { calculateProductPriceWithProgressiveDiscount } from "../utils/calculateProductPriceWithProgressiveDiscount";
import { calculateCartWithProgressiveDiscount } from "../utils/calculatePrice";
import { getProductsFresh } from "./getProducts";
import { getOrderConfirmedWhatsAppMessage } from "./constants/whatsappMessages";
import { buildPreparationStepCategories } from "@/src/modules/station/domain/buildPreparationStepCategories";
import {
  processDispatchAssignmentJobs,
} from "@/src/modules/dispatch/application/assignDeliveryOrderToDispatchQueue";
import { calculateSalesTaxInCents } from "@/src/constants/pricing";

type TCreateOrder = {
  cart: TCart;
  customerId?: string;
  orderType: TOrderType;
  paymentMethod: TPaymentMethod;
  language?: string;
  scheduleFor?: string;
  selectedPrize?: {
    prizeId: string;
    selectedProductIds: string[];
  };
  tipAmount?: number;
  addressId?: string;
  cupom?: string;
};

type CustomerContactRow = {
  name: string | null;
  phone: string | null;
};

type OrderCreationTransactionResult = {
  order: TOrder;
  orderId: string;
  customerId: string | null;
  orderNumber?: string | null;
};

const MAX_ORDER_CREATION_TRANSACTION_RETRIES = 3;

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

function normalizeOrderLanguage(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_LANGUAGE",
      },
    };
  }

  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_LANGUAGE",
      },
    };
  }

  return normalizedValue;
}

function resolvePrizeNameForLanguage(
  prize: {
    name: string;
    translations?: {
      [key: string]: {
        [key: string]: string;
      };
    };
  },
  language?: string,
): string {
  const normalizedLanguage = language?.trim().toLowerCase();

  if (normalizedLanguage) {
    const localizedTitle = prize.translations?.[normalizedLanguage]?.title;
    if (localizedTitle) return localizedTitle;
  }

  const englishTitle = prize.translations?.["en"]?.title;
  if (englishTitle) return englishTitle;

  return prize.name;
}

function toWhatsAppChatId(phone: string): string | undefined {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return undefined;

  const countryCode = (
    process.env.WHATSAPP_COUNTRY_CODE?.trim() || "1"
  ).replace(/\D/g, "");

  const phoneWithCountryCode =
    countryCode && !normalized.startsWith(countryCode)
      ? `${countryCode}${normalized}`
      : normalized;

  return `${phoneWithCountryCode}@c.us`;
}

async function sendOrderConfirmationWhatsAppMessage(input: {
  language?: string | null;
  customerName?: string | null;
  customerPhone: string;
  orderNumber?: string | null;
  totalInCents: number;
  orderType: TOrderType;
}) {
  const sessionId = process.env.WHATSAPP_SESSION_ID?.trim();

  if (!sessionId) {
    console.warn(
      "Skipping order confirmation WhatsApp message: WHATSAPP_SESSION_ID is not configured.",
    );
    return;
  }

  const chatId = toWhatsAppChatId(input.customerPhone);

  if (!chatId) {
    return;
  }

  const baseUrl = (
    process.env.WHATSAPP_API_BASE_URL?.trim() || "http://localhost:4000"
  ).replace(/\/$/, "");
  const message = getOrderConfirmedWhatsAppMessage({
    language: input.language,
    customerName: input.customerName,
    orderNumber: input.orderNumber,
    totalInCents: input.totalInCents,
    orderType: input.orderType,
  });
  const endpoint = `${baseUrl}/client/sendMessage/${sessionId}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.WHATSAPP_API_KEY) {
    headers["x-api-key"] = process.env.WHATSAPP_API_KEY;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatId,
        contentType: "string",
        content: message,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(
        `Order confirmation WhatsApp API request failed (${response.status}): ${errorBody}`,
      );
    }
  } catch (error) {
    console.error(
      "Failed to send order confirmation WhatsApp message:",
      error,
    );
  }
}

async function enqueueDispatchAssignmentJobTx(
  tx: Prisma.TransactionClient,
  data: {
    orderId: string;
    deliveryAddressId: string;
  },
): Promise<void> {
  await tx.$executeRaw`
    INSERT INTO "DispatchAssignmentJob" (
      "id",
      "orderId",
      "deliveryAddressId"
    )
    VALUES (
      ${randomUUID()},
      ${data.orderId},
      ${data.deliveryAddressId}
    )
    ON CONFLICT ("orderId")
    DO UPDATE SET
      "deliveryAddressId" = EXCLUDED."deliveryAddressId",
      "status" = 'PENDING',
      "availableAt" = NOW(),
      "lastError" = NULL,
      "completedAt" = NULL,
      "processingStartedAt" = NULL
  `;
}

async function triggerDispatchQueueRun(): Promise<void> {
  const workerBaseUrl = process.env.DISPATCH_QUEUE_WORKER_BASE_URL?.trim();

  if (!workerBaseUrl) {
    await processDispatchAssignmentJobs(1);
    return;
  }

  const endpoint = `${workerBaseUrl.replace(/\/$/, "")}/run`;
  const runSecret = process.env.DISPATCH_QUEUE_RUN_SECRET?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (runSecret) {
    headers.Authorization = `Bearer ${runSecret}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `QUEUE_WORKER_TRIGGER_FAILED status=${response.status} body=${errorBody}`,
    );
  }
}

async function createPreparationStepCategoriesForOrderTx(
  tx: Prisma.TransactionClient,
  order: TOrder,
): Promise<void> {
  const preparationSteps = await tx.preparationStep.findMany({
    include: {
      products: {
        select: {
          id: true,
        },
      },
    },
  });

  const categories = buildPreparationStepCategories(
    order,
    preparationSteps.map((step) => ({
      id: step.id,
      name: step.name,
      stationId: step.stationId,
      includeComments: step.includeComments,
      includeModifiers: step.includeModifiers,
      productIds: step.products.map((product) => product.id),
    })),
  );

  for (const category of categories) {
    await tx.preparationStepCategory.create({
      data: {
        id: category.id,
        categoryId: category.categoryId,
        orderId: category.orderId,
        preparationStepTracks: {
          create: category.steps.map((track) => ({
            id: track.id,
            preparationStepId: track.preparationStepId,
            quantity: track.quantity,
            comments: track.comments,
            completedComments: track.completedComments,
            preparationStepModifierTracks: track.preparationStepModifiers
              ? {
                  createMany: {
                    data: track.preparationStepModifiers.map((item) => ({
                      id: item.id,
                      completed: item.completed,
                      modifierGroupItemId: item.modifierGroupItem,
                    })),
                  },
                }
              : undefined,
          })),
        },
      },
    });
  }
}

function isRetryableOrderCreationTransactionError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}

const createOrder = async (data: TCreateOrder): Promise<TOrder> => {
  let deliveryFeeInCents = 0;

  if (!Array.isArray(data.cart?.items) || data.cart.items.length === 0) {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "CART_ITEMS_REQUIRED",
      },
    };
  }

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

    deliveryFeeInCents = deliveryAddress[0].deliveryFee;
  }
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  const progressiveDiscount = await getProgressiveDiscount();
  const productData = await getProductsFresh();
  const language = normalizeOrderLanguage(data.language);
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
  const sanitizedTipPercentage =
    typeof data.tipAmount === "number" && Number.isFinite(data.tipAmount)
      ? Math.max(data.tipAmount, 0)
      : 0;
  const tipAmountInCents = Math.round(
    (cartPricingSummary.discountedPrice * sanitizedTipPercentage) / 100,
  );
  const salesTaxInCents = calculateSalesTaxInCents(
    cartPricingSummary.discountedPrice,
  );
  const orderTotalInCents =
    cartPricingSummary.discountedPrice +
    tipAmountInCents +
    (data.orderType === "DELIVERY" ? deliveryFeeInCents : 0) +
    salesTaxInCents;
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
      prizeName: resolvePrizeNameForLanguage(selectedPrize, language),
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
  const runOrderCreationTransaction = async (): Promise<OrderCreationTransactionResult> =>
    prisma.$transaction(
      async (tx) => {
        const orderNumberLockKey = `order-number:${startOfDay.toISOString().slice(0, 10)}`;

        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtext(${orderNumberLockKey})::bigint)
        `;

        const [todayOrderCount] = await tx.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*)::BIGINT AS "count"
          FROM "Order"
          WHERE "createdAt" >= ${startOfDay}
            AND "createdAt" < ${endOfDay}
        `;
        const nextOrderNumber = (Number(todayOrderCount?.count ?? 0) + 1).toString();
        const providedCustomerId =
          typeof data.customerId === "string" ? data.customerId.trim() : "";
        const resolvedCustomerId = providedCustomerId || null;

        const createdOrder = await tx.order.create({
          data: {
            id: randomUUID(),
            amount: 0,
            number: nextOrderNumber,
            scheduleFor,
            deliveryAddressId:
              data.orderType === "DELIVERY" ? data.addressId : undefined,
            ...(resolvedCustomerId ? { customerId: resolvedCustomerId } : {}),
            paymentMethod: data.paymentMethod,
            tipAmount: sanitizedTipPercentage,
            language,
            progressiveDiscountSnapshot: progressiveDiscountSnapshot || undefined,
            type: data.orderType,
          },
        });

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
          await tx.orderProducts.create({
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

        const createdOrderProducts = (await tx.orderProducts.findMany({
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
            (modifierItem) => modifierItem.id,
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
          language: language ?? null,
          paidAt: null,
          status: "ACCEPTED",
          tip: sanitizedTipPercentage,
          tipAmount: sanitizedTipPercentage,
          orderProducts,
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

        await createPreparationStepCategoriesForOrderTx(tx, orderForPreparationSteps);

        if (data.orderType === "DELIVERY" && data.addressId) {
          await enqueueDispatchAssignmentJobTx(tx, {
            orderId: createdOrder.id,
            deliveryAddressId: data.addressId,
          });
        } else if (data.orderType === "TAKEAWAY") {
          const dispatchId = randomUUID();
          const [nextQueueIndexResult] = await tx.$queryRaw<
            { nextQueueIndex: number }[]
          >`
            SELECT COALESCE(MAX(dispatch."queueIndex"), 0)::INTEGER + 1 AS "nextQueueIndex"
            FROM "Dispatch" dispatch
          `;
          const nextQueueIndex = nextQueueIndexResult?.nextQueueIndex ?? 1;

          await tx.$executeRaw`
            INSERT INTO "Dispatch" (
              "id",
              "queueIndex",
              "dispatched",
              "dispatchAt",
              "driverId"
            )
            VALUES (
              ${dispatchId},
              ${nextQueueIndex},
              false,
              NULL,
              NULL
            )
          `;
          await tx.order.update({
            where: {
              id: createdOrder.id,
            },
            data: {
              dispatchId,
              dispatchOrderIndex: 1,
            },
          });
        }

        return {
          order,
          orderId: createdOrder.id,
          customerId: resolvedCustomerId,
          orderNumber: createdOrder.number,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

  let transactionResult: OrderCreationTransactionResult | null = null;
  let attempt = 0;

  while (attempt < MAX_ORDER_CREATION_TRANSACTION_RETRIES) {
    try {
      transactionResult = await runOrderCreationTransaction();
      break;
    } catch (error) {
      attempt += 1;
      const canRetry =
        attempt < MAX_ORDER_CREATION_TRANSACTION_RETRIES &&
        isRetryableOrderCreationTransactionError(error);

      if (!canRetry) {
        throw error;
      }
    }
  }

  if (!transactionResult) {
    throw new Error("ORDER_CREATION_TRANSACTION_FAILED");
  }

  const [customerContact] = transactionResult.customerId
    ? await prisma.$queryRaw<CustomerContactRow[]>`
        SELECT "name", "phone"
        FROM "Customer"
        WHERE "id" = ${transactionResult.customerId}
        LIMIT 1
      `
    : [null];

  if (data.orderType === "DELIVERY" && data.addressId) {
    after(async () => {
      await triggerDispatchQueueRun().catch((error: unknown) => {
        console.error("Failed to trigger dispatch assignment processing:", error);
      });
    });
  }

  const customerPhone = customerContact?.phone;

  if (customerPhone) {
    after(async () => {
      await sendOrderConfirmationWhatsAppMessage({
        language: language ?? null,
        customerName: customerContact.name,
        customerPhone,
        orderNumber: transactionResult.orderNumber,
        totalInCents: orderTotalInCents,
        orderType: data.orderType,
      });
    });
  }

  return transactionResult.order;
};

export default createOrder;
