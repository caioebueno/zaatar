"use server";

import { after } from "next/server";
import { MAX_DELIVERY_FEE_CENTS } from "@/utils/calculateDeliveryFee";
import prisma from "../prisma";
import TCart, { TCartItem } from "../types/cart";
import getProgressiveDiscount from "./getProgressiveDiscount";
import { randomUUID } from "crypto";
import { Prisma } from "@/src/generated/prisma";
import {
  TOrder,
  TOrderProduct,
  TOrderType,
  TPaymentMethod,
  TPaymentProvider,
} from "./types/order";
import { calculateProductPriceWithProgressiveDiscount } from "../utils/calculateProductPriceWithProgressiveDiscount";
import { calculateCartWithProgressiveDiscount } from "../utils/calculatePrice";
import { getProductsFresh } from "./getProducts";
import { getRedeemedRewardsByOrderIds } from "@/src/getRedeemedRewardsByOrderIds";
import { getOrderConfirmedWhatsAppMessage } from "./constants/whatsappMessages";
import { buildPreparationStepCategories } from "@/src/modules/station/domain/buildPreparationStepCategories";
import {
  processDispatchAssignmentJobs,
} from "@/src/modules/dispatch/application/assignDeliveryOrderToDispatchQueue";
import { assignDeliveryOrderToDispatchUseCase } from "@/src/modules/dispatch/application/assignDeliveryOrderToDispatch";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";
import { calculateSalesTaxInCents } from "@/src/constants/pricing";
import { cookies } from "next/headers";
import {
  ensureComboProductItemTable,
  getComboProductsByComboIds,
} from "./comboProductsStore";
import {
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/src/whatsappApi";
import {
  MENU_ID_COOKIE_NAME,
  MENU_TAGS_COOKIE_NAME,
  PROMOTION_ID_COOKIE_NAME,
} from "@/src/constants/menu";
import { getStripeClient } from "@/src/stripe";
import { getConfiguredBusinessId } from "@/src/constants/business";

type TCreateOrder = {
  cart: TCart;
  customerId?: string;
  orderType: TOrderType;
  paymentMethod: TPaymentMethod;
  paymentProvider?: TPaymentProvider;
  selectedCardId?: string;
  menuId?: string;
  promotionId?: string;
  tags?: string[];
  language?: string;
  scheduleFor?: string;
  selectedPrize?: {
    prizeId: string;
    selectedProductIds: string[];
  };
  tipAmount?: number;
  addressId?: string;
  branchId?: string;
  cupom?: string;
  source?: "MENU" | "POS";
};

type CustomerContactRow = {
  name: string | null;
  phone: string | null;
};

type RedeemedRewardsByOrderId = Awaited<
  ReturnType<typeof getRedeemedRewardsByOrderIds>
>;

type DirectComboProductForPrep = {
  productId: string;
  quantity: number;
};

type OrderCreationTransactionResult = {
  order: TOrder;
  orderId: string;
  customerId: string | null;
  orderNumber?: string | null;
};

const MAX_ORDER_CREATION_TRANSACTION_RETRIES = 3;
const MAX_ORDER_TAGS_PER_ORDER = 30;
const DEFAULT_TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_EN =
  "HXb4649c3b598a13c6564a9f6e41dc1e33";
const DEFAULT_TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_PT =
  "HX161c27eae7de72fd28fb0f3f917c12d8";
const DEFAULT_TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_ES =
  "HX1f76ad9c09bd8558376b138aa825c29d";

function calculatePosItemUnitPrice(input: {
  product: {
    price: number | null;
    comparedAtPrice: number | null;
    modifierGroups: Array<{
      items: Array<{
        id: string;
        price: number;
      }>;
    }>;
    comboSlots: Array<{
      id: string;
      options: Array<{
        productId: string;
        extraPrice: number;
      }>;
    }>;
  };
  cartItem: TCartItem;
}): { actualPrice: number; fullPrice: number } {
  const modifierPriceMap = new Map<string, number>();
  for (const group of input.product.modifierGroups) {
    for (const item of group.items) {
      modifierPriceMap.set(item.id, item.price);
    }
  }

  const modifierUnitPrice = (input.cartItem.modifiers ?? []).reduce((sum, selected) => {
    return sum + (modifierPriceMap.get(selected.modifierItemId) ?? 0);
  }, 0);

  const comboExtraPriceByKey = new Map<string, number>();
  for (const slot of input.product.comboSlots) {
    for (const option of slot.options) {
      comboExtraPriceByKey.set(`${slot.id}:${option.productId}`, option.extraPrice);
    }
  }

  const comboSelectionUnitPrice = (input.cartItem.comboSelections ?? []).reduce(
    (sum, selection) => {
      const key = `${selection.slotId}:${selection.optionProductId}`;
      const resolvedExtraPrice =
        comboExtraPriceByKey.get(key) ?? selection.extraPrice ?? 0;
      const quantity =
        typeof selection.quantity === "number" &&
        Number.isInteger(selection.quantity) &&
        selection.quantity > 0
          ? selection.quantity
          : 1;

      return sum + resolvedExtraPrice * quantity;
    },
    0,
  );

  const basePrice = input.product.price ?? 0;
  const baseFullPrice = input.product.comparedAtPrice ?? basePrice;

  return {
    actualPrice: Number((basePrice + modifierUnitPrice + comboSelectionUnitPrice).toFixed(2)),
    fullPrice: Number((baseFullPrice + modifierUnitPrice + comboSelectionUnitPrice).toFixed(2)),
  };
}

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

function normalizeOrderPaymentProvider(
  value: unknown,
): TPaymentProvider | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_PAYMENT_PROVIDER",
      },
    };
  }

  const normalizedValue = value.trim().toUpperCase();
  if (!normalizedValue) {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_PAYMENT_PROVIDER",
      },
    };
  }

  if (normalizedValue !== "STRIPE") {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_PAYMENT_PROVIDER",
      },
    };
  }

  return "STRIPE";
}

function normalizeSelectedCardId(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_SELECTED_CARD",
      },
    };
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_SELECTED_CARD",
      },
    };
  }

  return normalizedValue;
}

function normalizeOrderTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
        .filter((item) => item.length > 0 && item.length <= 64),
    ),
  ).slice(0, MAX_ORDER_TAGS_PER_ORDER);
}

function parseOrderTagsFromCookie(value: string | undefined): string[] {
  if (!value) return [];

  return normalizeOrderTags(value.split("|"));
}

function normalizeOrderLanguageForTemplate(
  value: string | null | undefined,
): "en" | "pt" | "es" {
  const normalizedValue = (value || "").trim().toLowerCase();
  const baseLanguage = normalizedValue.split("-")[0];

  if (baseLanguage === "pt" || baseLanguage === "es") {
    return baseLanguage;
  }

  return "en";
}

function getLocalizedOrderTypeLabel(
  language: "en" | "pt" | "es",
  orderType: TOrderType,
): string {
  if (language === "pt") {
    return orderType === "DELIVERY" ? "Entrega" : "Retirada";
  }

  if (language === "es") {
    return orderType === "DELIVERY" ? "Entrega" : "Recogida";
  }

  return orderType === "DELIVERY" ? "Delivery" : "Pickup";
}

function resolveOrderConfirmationTemplateSid(
  language: "en" | "pt" | "es",
): string {
  if (language === "pt") {
    return (
      process.env.TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_PT?.trim() ||
      DEFAULT_TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_PT
    );
  }

  if (language === "es") {
    return (
      process.env.TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_ES?.trim() ||
      DEFAULT_TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_ES
    );
  }

  return (
    process.env.TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID?.trim() ||
    DEFAULT_TWILIO_ORDER_CONFIRMATION_TEMPLATE_SID_EN
  );
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

async function sendOrderConfirmationWhatsAppMessage(input: {
  language?: string | null;
  customerName?: string | null;
  customerPhone: string;
  orderNumber?: string | null;
  totalInCents: number;
  orderType: TOrderType;
}) {
  const templateLanguage = normalizeOrderLanguageForTemplate(input.language);
  const message = getOrderConfirmedWhatsAppMessage({
    language: input.language,
    customerName: input.customerName,
    orderNumber: input.orderNumber,
    totalInCents: input.totalInCents,
    orderType: input.orderType,
  });
  const templateSid = resolveOrderConfirmationTemplateSid(templateLanguage);

  try {
    if (templateSid) {
      await sendWhatsAppTemplateMessage({
        customerPhone: input.customerPhone,
        contentSid: templateSid,
        contentVariables: {
          "1": input.customerName?.trim() || "there",
          "2": input.orderNumber?.trim() || "-",
          "3": (Math.max(input.totalInCents, 0) / 100).toFixed(2),
          "4": getLocalizedOrderTypeLabel(templateLanguage, input.orderType),
        },
      });
      return;
    }

    await sendWhatsAppTextMessage({
      customerPhone: input.customerPhone,
      content: message,
    });
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

function hasErrorCode(error: unknown, targetCode: string): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; cause?: unknown };
  if (record.code === targetCode) return true;

  const cause = record.cause;
  if (cause && typeof cause === "object") {
    const causeRecord = cause as {
      code?: unknown;
      errors?: Array<{ code?: unknown }>;
    };
    if (causeRecord.code === targetCode) return true;
    if (
      Array.isArray(causeRecord.errors) &&
      causeRecord.errors.some((item) => item?.code === targetCode)
    ) {
      return true;
    }
  }

  return false;
}

async function triggerDispatchQueueRun(input?: {
  orderId?: string;
}): Promise<void> {
  const orderIdLabel = input?.orderId ? ` orderId=${input.orderId}` : "";
  const workerBaseUrl = process.env.DISPATCH_QUEUE_WORKER_BASE_URL?.trim();
  const jobsToProcess = 1;

  if (!workerBaseUrl) {
    await processDispatchAssignmentJobs(jobsToProcess);
    console.info(
      `DISPATCH_ASSIGNMENT_LOCAL_PROCESSING reason=no_worker_base_url${orderIdLabel}`,
    );
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

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");

      // Worker trigger failed: fallback to local processing so dispatches
      // are still created immediately for delivery orders.
      await processDispatchAssignmentJobs(jobsToProcess);
      console.info(
        `DISPATCH_ASSIGNMENT_LOCAL_PROCESSING reason=remote_worker_http_${response.status}${orderIdLabel}`,
      );
      console.warn(
        `QUEUE_WORKER_TRIGGER_FAILED status=${response.status} body=${errorBody} (fell_back_to_local_queue_processing=true)`,
      );
      return;
    }

    const responseJson = await response
      .json()
      .catch(() => null as { ok?: boolean } | null);

    // Older workers return 202 accepted without execution result. In that case,
    // fallback locally to guarantee dispatch assignment execution.
    if (response.status !== 200 || responseJson?.ok !== true) {
      await processDispatchAssignmentJobs(jobsToProcess);
      console.info(
        `DISPATCH_ASSIGNMENT_LOCAL_PROCESSING reason=remote_worker_unverified_response status=${response.status}${orderIdLabel}`,
      );
      console.warn(
        `QUEUE_WORKER_TRIGGER_UNVERIFIED status=${response.status} (fell_back_to_local_queue_processing=true)`,
      );
      return;
    }

    console.info(
      `DISPATCH_ASSIGNMENT_REMOTE_TRIGGERED worker=${endpoint}${orderIdLabel}`,
    );
  } catch (error) {
    // Worker request threw (DNS/network/etc): fallback to local processing.
    await processDispatchAssignmentJobs(jobsToProcess);
    console.info(
      `DISPATCH_ASSIGNMENT_LOCAL_PROCESSING reason=remote_worker_request_error${orderIdLabel}`,
    );
    if (hasErrorCode(error, "ECONNREFUSED")) {
      console.info(
        "QUEUE_WORKER_TRIGGER_CONNECTION_REFUSED (fell_back_to_local_queue_processing=true)",
      );
      return;
    }

    console.warn(
      "QUEUE_WORKER_TRIGGER_REQUEST_FAILED (fell_back_to_local_queue_processing=true):",
      error,
    );
  }
}

async function ensureDeliveryOrderHasDispatch(input: {
  orderId: string;
  deliveryAddressId: string;
}): Promise<void> {
  const [orderRow] = await prisma.$queryRaw<{ dispatchId: string | null }[]>`
    SELECT "dispatchId"
    FROM "Order"
    WHERE "id" = ${input.orderId}
    LIMIT 1
  `;

  if (orderRow?.dispatchId) {
    console.info(
      `DISPATCH_ALREADY_ASSIGNED orderId=${input.orderId} dispatchId=${orderRow.dispatchId}`,
    );
    return;
  }

  await assignDeliveryOrderToDispatchUseCase(prismaDispatchRepository, {
    orderId: input.orderId,
    deliveryAddressId: input.deliveryAddressId,
  });
  console.info(`DISPATCH_ASSIGNED_LOCALLY orderId=${input.orderId}`);
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
      goalMinutes:
        typeof (step as { goalMinutes?: unknown }).goalMinutes === "number"
          ? Math.max(
              0,
              Math.floor((step as { goalMinutes?: number }).goalMinutes ?? 0),
            )
          : 0,
      includeComments: step.includeComments,
      includeModifiers: step.includeModifiers,
      productIds: step.products.map((product) => product.id),
    })),
  );

  for (const category of categories) {
    await tx.preparationStepCategory.create({
      data: {
        id: category.id,
        stationId: category.stationId ?? null,
        orderId: category.orderId,
        preparationStepTracks: {
          create: category.steps.map((track) => ({
            id: track.id,
            preparationStepId: track.preparationStepId,
            quantity: track.quantity,
            goalMinutes: track.goalMinutes,
            expectedAt: track.expectedAt ? new Date(track.expectedAt) : null,
            completedAt: track.completedAt ? new Date(track.completedAt) : null,
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

function buildReadableOrderNumber(): string {
  return `${Math.floor(Math.random() * 900) + 100}`;
}

const createOrder = async (data: TCreateOrder): Promise<TOrder> => {
  console.log('[createOrder] called', { paymentMethod: data.paymentMethod, paymentProvider: data.paymentProvider, orderType: data.orderType });
  let deliveryFeeInCents = 0;
  const checkoutTimingStartedAt = Date.now();
  let checkoutTimingLastAt = checkoutTimingStartedAt;
  const checkoutTimingSteps: Array<{ step: string; ms: number }> = [];
  const markCheckoutTimingStep = (step: string) => {
    const nowMs = Date.now();
    checkoutTimingSteps.push({
      step,
      ms: nowMs - checkoutTimingLastAt,
    });
    checkoutTimingLastAt = nowMs;
  };
  const flushCheckoutTiming = (
    status: "SUCCESS" | "FAILED",
    failureCode?: string,
  ) => {
    console.info(
      "[checkout-timing]",
      JSON.stringify({
        status,
        ...(failureCode ? { failureCode } : {}),
        totalMs: Date.now() - checkoutTimingStartedAt,
        orderType: data.orderType,
        paymentMethod: data.paymentMethod,
        paymentProvider: data.paymentProvider ?? null,
        source: data.source ?? "MENU",
        cartItemsCount: Array.isArray(data.cart?.items) ? data.cart.items.length : 0,
        steps: checkoutTimingSteps,
      }),
    );
  };

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
  markCheckoutTimingStep("delivery-fee");
  const now = new Date();
  const progressiveDiscount = await getProgressiveDiscount();
  const normalizedMenuId =
    typeof data.menuId === "string" && data.menuId.trim().length > 0
      ? data.menuId.trim()
      : null;
  const normalizedPromotionId =
    typeof data.promotionId === "string" && data.promotionId.trim().length > 0
      ? data.promotionId.trim()
      : null;
  const normalizedTags = normalizeOrderTags(data.tags);
  let menuIdFromCookie: string | null = null;
  let promotionIdFromCookie: string | null = null;
  let tagsFromCookie: string[] = [];

  if (!normalizedMenuId || !normalizedPromotionId || normalizedTags.length === 0) {
    try {
      const cookieStore = await cookies();
      if (!normalizedMenuId) {
        const rawMenuIdFromCookie = cookieStore.get(MENU_ID_COOKIE_NAME)?.value;
        menuIdFromCookie =
          typeof rawMenuIdFromCookie === "string" &&
          rawMenuIdFromCookie.trim().length > 0
            ? rawMenuIdFromCookie.trim()
            : null;
      }
      if (!normalizedPromotionId) {
        const rawPromotionIdFromCookie = cookieStore.get(
          PROMOTION_ID_COOKIE_NAME,
        )?.value;
        promotionIdFromCookie =
          typeof rawPromotionIdFromCookie === "string" &&
          rawPromotionIdFromCookie.trim().length > 0
            ? rawPromotionIdFromCookie.trim()
            : null;
      }
      if (normalizedTags.length === 0) {
        tagsFromCookie = parseOrderTagsFromCookie(
          cookieStore.get(MENU_TAGS_COOKIE_NAME)?.value,
        );
      }
    } catch {
      menuIdFromCookie = null;
      promotionIdFromCookie = null;
      tagsFromCookie = [];
    }
  }
  const orderTags = normalizedTags.length > 0 ? normalizedTags : tagsFromCookie;

  await ensureComboProductItemTable(prisma);
  const productData = await getProductsFresh(
    normalizedMenuId ?? menuIdFromCookie,
    normalizedPromotionId ?? promotionIdFromCookie,
  );
  markCheckoutTimingStep("catalog-load");
  const language = normalizeOrderLanguage(data.language);
  const paymentProvider = normalizeOrderPaymentProvider(data.paymentProvider);
  if (paymentProvider && data.paymentMethod !== "CARD") {
    throw {
      code: "INVALID_PARAMS",
      data: {
        message: "INVALID_PAYMENT_PROVIDER",
      },
    };
  }
  const selectedCardId = normalizeSelectedCardId(data.selectedCardId);
  const normalizedCustomerId =
    typeof data.customerId === "string" ? data.customerId.trim() : "";
  const normalizedBranchId =
    typeof data.branchId === "string" ? data.branchId.trim() : "";
  const resolvedCustomerId = normalizedCustomerId || null;
  const configuredBusinessId = getConfiguredBusinessId();
  const resolveBranchIdForOrder = async (): Promise<string | null> => {
    if (configuredBusinessId) {
      const branches = await prisma.branch.findMany({
        where: {
          businessId: configuredBusinessId,
        },
        select: {
          id: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (branches.length === 1) {
        const onlyBranchId = branches[0]!.id;
        if (normalizedBranchId && normalizedBranchId !== onlyBranchId) {
          throw {
            code: "INVALID_PARAMS",
            data: {
              message: "INVALID_BRANCH_ID",
            },
          };
        }

        return onlyBranchId;
      }

      if (branches.length > 1) {
        if (!normalizedBranchId) {
          throw {
            code: "INVALID_PARAMS",
            data: {
              message: "BRANCH_ID_REQUIRED",
            },
          };
        }

        const hasBranch = branches.some((branch) => branch.id === normalizedBranchId);
        if (!hasBranch) {
          throw {
            code: "INVALID_PARAMS",
            data: {
              message: "INVALID_BRANCH_ID",
            },
          };
        }

        return normalizedBranchId;
      }

      if (normalizedBranchId) {
        throw {
          code: "INVALID_PARAMS",
          data: {
            message: "INVALID_BRANCH_ID",
          },
        };
      }

      return null;
    }

    if (!normalizedBranchId) return null;

    const branch = await prisma.branch.findUnique({
      where: {
        id: normalizedBranchId,
      },
      select: {
        id: true,
      },
    });

    if (!branch) {
      throw {
        code: "INVALID_PARAMS",
        data: {
          message: "INVALID_BRANCH_ID",
        },
      };
    }

    return branch.id;
  };
  const resolvedBranchId = await resolveBranchIdForOrder();
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

    const promotionProduct = productData.activePromotion?.products?.find(
      (item) => item.id === productId,
    );
    if (promotionProduct) {
      return {
        product: promotionProduct,
        categoryId: null,
      };
    }

    return null;
  };
  const buildComboSelectionComments = (cartItem: TCartItem): string | null => {
    if (!Array.isArray(cartItem.comboSelections) || cartItem.comboSelections.length === 0) {
      return null;
    }

    const comboProduct = getCatalogProductById(cartItem.productId)?.product;
    if (!comboProduct?.comboSlots?.length) {
      return null;
    }

    const comboSelectionLines: string[] = [];

    for (const slot of comboProduct.comboSlots) {
      const slotSelections = cartItem.comboSelections
        .filter((selection) => selection.slotId === slot.id && selection.quantity > 0)
        .map((selection) => {
          const option = slot.options.find(
            (slotOption) => slotOption.productId === selection.optionProductId,
          );
          const optionName =
            selection.optionProductName ||
            option?.productName ||
            "Selected option";

          return selection.quantity > 1
            ? `${optionName} x${selection.quantity}`
            : optionName;
        });

      if (slotSelections.length === 0) continue;

      comboSelectionLines.push(`${slot.name}: ${slotSelections.join(", ")}`);
    }

    if (comboSelectionLines.length === 0) return null;

    return comboSelectionLines.join("\n");
  };
  const cartPricingSummary = calculateCartWithProgressiveDiscount(
    productData.categories,
    data.cart,
    progressiveDiscount,
    productData.activePromotion?.products,
    productData.promotionProductIds,
  );
  const discountedSubtotalInCents = Math.round(cartPricingSummary.discountedPrice);
  const sanitizedTipPercentage =
    typeof data.tipAmount === "number" && Number.isFinite(data.tipAmount)
      ? Math.max(data.tipAmount, 0)
      : 0;
  const tipAmountInCents = Math.round(
    (discountedSubtotalInCents * sanitizedTipPercentage) / 100,
  );
  const salesTaxInCents = calculateSalesTaxInCents(
    discountedSubtotalInCents,
  );
  const orderTotalInCents = Math.round(
    discountedSubtotalInCents +
    tipAmountInCents +
    (data.orderType === "DELIVERY" ? deliveryFeeInCents : 0) +
    salesTaxInCents,
  );
  markCheckoutTimingStep("pricing");
  const createdOrderId = randomUUID();
  const nextOrderNumber = buildReadableOrderNumber();

  type PosPricingProduct = {
    id: string;
    name: string;
    categoryId: string | null;
    itemType: "PRODUCT" | "COMBO";
    translations: unknown;
    price: number | null;
    comparedAtPrice: number | null;
    modifierGroups: Array<{
      items: Array<{
        id: string;
        price: number;
      }>;
    }>;
    comboSlots: Array<{
      id: string;
      options: Array<{
        productId: string;
        extraPrice: number;
      }>;
    }>;
  };
  const posPricingProductIdsToLoad = new Set<string>();

  const resolvedCartItemPrices = data.cart.items.map((cartItem) => {
    const menuPrice = calculateProductPriceWithProgressiveDiscount(
      cartItem.productId,
      progressiveDiscount,
      data.cart,
      productData.categories,
      productData.activePromotion?.products,
      productData.promotionProductIds,
      { cartItem },
    );
    if (!menuPrice && data.source === "POS") {
      posPricingProductIdsToLoad.add(cartItem.productId);
    }

    return {
      cartItem,
      price: menuPrice,
    };
  });

  const posPricingProducts =
    posPricingProductIdsToLoad.size > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in: Array.from(posPricingProductIdsToLoad),
            },
          },
          select: {
            id: true,
            name: true,
            categoryId: true,
            itemType: true,
            translations: true,
            price: true,
            comparedAtPrice: true,
            modifierGroups: {
              select: {
                items: {
                  select: {
                    id: true,
                    price: true,
                  },
                },
              },
            },
            comboSlots: {
              select: {
                id: true,
                options: {
                  select: {
                    productId: true,
                    extraPrice: true,
                  },
                },
              },
            },
          },
        })
      : [];
  const posPricingProductsById = new Map<string, PosPricingProduct>(
    posPricingProducts.map((product) => [product.id, product as PosPricingProduct]),
  );

  const preparedOrderProducts = resolvedCartItemPrices.map(
    ({ cartItem, price }) => {
      let resolvedPrice = price;
      if (!resolvedPrice && data.source === "POS") {
        const posProduct = posPricingProductsById.get(cartItem.productId);
        if (posProduct) {
          const posUnitPrice = calculatePosItemUnitPrice({
            product: posProduct,
            cartItem,
          });
          resolvedPrice = {
            fullPrice: posUnitPrice.fullPrice,
            actualPrice: posUnitPrice.actualPrice,
            discountedPrice: posUnitPrice.actualPrice,
            discountAmount: Number(
              (posUnitPrice.fullPrice - posUnitPrice.actualPrice).toFixed(2),
            ),
            appliedStep: null,
          };
        }
      }

      if (!resolvedPrice) {
        throw {
          code: "PRODUCT_NOT_AVAILABLE_IN_MENU_CONTEXT",
          data: {
            productId: cartItem.productId,
            menuId: data.menuId ?? null,
            promotionId: data.promotionId ?? null,
            source: data.source ?? "MENU",
          },
        };
      }

      const itemDescription =
        typeof cartItem.description === "string" ? cartItem.description.trim() : "";
      const comboSelectionDescription = buildComboSelectionComments(cartItem);
      const comments = [itemDescription, comboSelectionDescription]
        .filter((value): value is string => Boolean(value))
        .join("\n");
      const catalogProductLookup = getCatalogProductById(cartItem.productId);
      const catalogProduct = catalogProductLookup?.product;
      const posProduct = posPricingProductsById.get(cartItem.productId);

      return {
        id: randomUUID(),
        amount: resolvedPrice.actualPrice,
        fullAmount: resolvedPrice.fullPrice,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        comments: comments.length > 0 ? comments : null,
        modifierItemIds: cartItem.modifiers.map((modItem) => modItem.modifierItemId),
        productName: catalogProduct?.name ?? posProduct?.name ?? "Product",
        productCategoryId:
          catalogProductLookup?.categoryId ??
          posProduct?.categoryId ??
          catalogProduct?.categoryId ??
          undefined,
      };
    },
  );

  markCheckoutTimingStep("prepare-order-products");

  const shouldChargeWithStripe =
    data.paymentMethod === "CARD" && paymentProvider === "STRIPE";

  const chargeStripeCard = async (): Promise<{ paymentIntentId: string }> => {
    if (!resolvedCustomerId) {
      throw {
        code: "INVALID_PARAMS",
        data: {
          message: "CARD_PAYMENT_REQUIRES_CUSTOMER",
        },
      };
    }

    const stripeCustomerRows = await prisma.$queryRaw<
      { stripeCustomerId: string | null }[]
    >`
      SELECT "stripeCustomerId"
      FROM "Customer"
      WHERE "id" = ${resolvedCustomerId}
      LIMIT 1
    `;
    const stripeCustomerId = stripeCustomerRows[0]?.stripeCustomerId?.trim();

    if (!stripeCustomerId) {
      throw {
        code: "STRIPE_PAYMENT_FAILED",
        data: {
          message: "STRIPE_CUSTOMER_NOT_FOUND",
        },
      };
    }

    const cardRows = selectedCardId
      ? await prisma.$queryRaw<{ stripePaymentMethodId: string }[]>`
          SELECT "stripePaymentMethodId"
          FROM "CustomerCard"
          WHERE "id" = ${selectedCardId}
            AND "customerId" = ${resolvedCustomerId}
          LIMIT 1
        `
      : await prisma.$queryRaw<{ stripePaymentMethodId: string }[]>`
          SELECT "stripePaymentMethodId"
          FROM "CustomerCard"
          WHERE "customerId" = ${resolvedCustomerId}
          ORDER BY "isDefault" DESC, "createdAt" ASC
          LIMIT 1
        `;

    const stripePaymentMethodId = cardRows[0]?.stripePaymentMethodId?.trim();
    if (!stripePaymentMethodId) {
      throw {
        code: "STRIPE_PAYMENT_FAILED",
        data: {
          message: selectedCardId
            ? "STRIPE_SELECTED_CARD_NOT_FOUND"
            : "STRIPE_CARD_REQUIRED",
        },
      };
    }

    // Resolve the business's Stripe connected account for payment routing
    let connectedStripeAccountId: string | null = null;
    const businessId = configuredBusinessId;
    console.log('[createOrder] chargeStripeCard start', { businessId, orderTotalInCents, stripeCustomerId, stripePaymentMethodId });
    try {
      if (businessId) {
        const businessRows = await prisma.$queryRaw<
          { stripeAccountId: string | null; stripeChargesEnabled: boolean }[]
        >`
          SELECT "stripeAccountId", "stripeChargesEnabled"
          FROM "Business"
          WHERE "id" = ${businessId}
          LIMIT 1
        `;
        const biz = businessRows[0];
        console.log('[createOrder] business lookup', { biz });
        if (biz?.stripeAccountId && biz.stripeChargesEnabled) {
          connectedStripeAccountId = biz.stripeAccountId;
        }
      }
    } catch (bizErr) {
      console.error('[createOrder] business lookup failed, falling back to direct charge', bizErr);
    }
    console.log('[createOrder] connectedStripeAccountId', connectedStripeAccountId);

    try {
      if (!Number.isInteger(orderTotalInCents) || orderTotalInCents <= 0) {
        throw {
          code: "STRIPE_PAYMENT_FAILED",
          data: {
            message: "INVALID_STRIPE_AMOUNT",
            orderTotalInCents,
          },
        };
      }

      const stripe = getStripeClient();

      // Platform fee: set STRIPE_PLATFORM_FEE_PERCENT in env (e.g. "2.5" for 2.5%)
      const feePct = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "0");
      const applicationFeeAmount =
        connectedStripeAccountId && feePct > 0
          ? Math.round(orderTotalInCents * (feePct / 100))
          : undefined;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: orderTotalInCents,
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: stripePaymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          source: data.source ?? "MENU",
          orderType: data.orderType,
          customerId: resolvedCustomerId,
          ...(businessId ? { businessId } : {}),
        },
        ...(connectedStripeAccountId
          ? {
              transfer_data: { destination: connectedStripeAccountId },
              ...(applicationFeeAmount !== undefined
                ? { application_fee_amount: applicationFeeAmount }
                : {}),
            }
          : {}),
      });

      if (paymentIntent.status !== "succeeded") {
        throw {
          code: "STRIPE_PAYMENT_FAILED",
          data: {
            message: "STRIPE_PAYMENT_NOT_COMPLETED",
            paymentIntentStatus: paymentIntent.status,
          },
        };
      }

      return { paymentIntentId: paymentIntent.id };
    } catch (error) {
      flushCheckoutTiming("FAILED", "STRIPE_PAYMENT_FAILED");
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "STRIPE_PAYMENT_FAILED"
      ) {
        throw error;
      }

      throw {
        code: "STRIPE_PAYMENT_FAILED",
        data: {
          message: "STRIPE_PAYMENT_FAILED",
          error:
            error instanceof Error
              ? error.message
              : "Unknown Stripe payment error",
        },
      };
    }
  };

  const refundStripeCharge = async (paymentIntentId: string): Promise<void> => {
    try {
      const stripe = getStripeClient();
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
    } catch (error) {
      console.error("Failed to refund Stripe payment after order error:", error);
      throw {
        code: "STRIPE_CHARGED_BUT_REFUND_FAILED",
        data: {
          message: "STRIPE_CHARGED_BUT_REFUND_FAILED",
          paymentIntentId,
        },
      };
    }
  };

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
        const orderCreateData = {
          id: createdOrderId,
          amount: 0,
          number: nextOrderNumber,
          scheduleFor,
          deliveryAddressId:
            data.orderType === "DELIVERY" ? data.addressId : undefined,
          ...(resolvedCustomerId ? { customerId: resolvedCustomerId } : {}),
          paymentMethod: data.paymentMethod,
          ...(shouldChargeWithStripe ? { paidAt: now } : {}),
          tipAmount: sanitizedTipPercentage,
          language,
          progressiveDiscountSnapshot: progressiveDiscountSnapshot || undefined,
          type: data.orderType,
        } as Prisma.OrderUncheckedCreateInput;

        const createdOrder = await tx.order.create({
          data: orderCreateData,
        });

        if (resolvedBranchId) {
          await tx.$executeRaw`
            UPDATE "Order"
            SET "branchId" = ${resolvedBranchId}
            WHERE "id" = ${createdOrder.id}
          `;
        }

        if (paymentProvider) {
          await tx.$executeRaw`
            UPDATE "Order"
            SET "paymentProvider" = ${paymentProvider}::"PaymentProvider"
            WHERE "id" = ${createdOrder.id}
          `;
        }

        if (orderTags.length > 0) {
          await tx.$executeRaw`
            UPDATE "Order"
            SET "tags" = ${orderTags}
            WHERE "id" = ${createdOrder.id}
          `;
        }

        const redeemedRewardProductCountsMap = new Map<string, number>();
        if (resolvedCustomerId) {
          const rewardsToRedeem = await tx.customerReward.findMany({
            where: {
              customerId: resolvedCustomerId,
              status: "ACTIVE",
              redeemedByOrderId: null,
              OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
            },
            select: {
              id: true,
              productId: true,
              quantity: true,
            },
          });

          for (const reward of rewardsToRedeem) {
            if (!reward.productId) continue;
            const rewardQuantity =
              typeof reward.quantity === "number" &&
              Number.isInteger(reward.quantity) &&
              reward.quantity > 0
                ? reward.quantity
                : 1;
            redeemedRewardProductCountsMap.set(
              reward.productId,
              (redeemedRewardProductCountsMap.get(reward.productId) ?? 0) +
                rewardQuantity,
            );
          }

          await tx.customerReward.updateMany({
            where: {
              id: {
                in: rewardsToRedeem.map((reward) => reward.id),
              },
            },
            data: {
              status: "REDEEMED",
              redeemedAt: now,
              redeemedByOrderId: createdOrder.id,
            },
          });
        }

        await tx.orderProducts.createMany({
          data: preparedOrderProducts.map((item) => ({
            id: item.id,
            amount: item.amount,
            productId: item.productId,
            orderId: createdOrder.id,
            fullAmount: item.fullAmount,
            quantity: item.quantity,
            comments: item.comments,
          })),
        });

        for (const item of preparedOrderProducts) {
          if (item.modifierItemIds.length === 0) continue;
          await tx.orderProducts.update({
            where: {
              id: item.id,
            },
            data: {
              modifierGroupItems: {
                connect: item.modifierItemIds.map((modifierItemId) => ({
                  id: modifierItemId,
                })),
              },
            },
          });
        }

        const orderProducts: TOrderProduct[] = preparedOrderProducts.map((item) => ({
          id: item.id,
          amount: item.amount,
          fullAmount: item.fullAmount,
          productId: item.productId,
          quantity: item.quantity,
          comments: item.comments || undefined,
          selectedModifierGroupItemIds: item.modifierItemIds,
          product: {
            id: item.productId,
            name: item.productName,
            categoryId: item.productCategoryId || undefined,
            preparationStep: [],
          },
        }));

        const preparationLookupProductIds = new Set<string>();
        for (const cartItem of data.cart.items) {
          preparationLookupProductIds.add(cartItem.productId);
          if (Array.isArray(cartItem.comboSelections) && cartItem.comboSelections.length > 0) {
            for (const selection of cartItem.comboSelections) {
              preparationLookupProductIds.add(selection.optionProductId);
            }
          }
        }
        for (const selectedPrizeProduct of selectedPrizeSnapshot?.selectedProductIds ?? []) {
          preparationLookupProductIds.add(selectedPrizeProduct);
        }
        for (const rewardProductId of redeemedRewardProductCountsMap.keys()) {
          preparationLookupProductIds.add(rewardProductId);
        }

        const preparationLookupProducts =
          preparationLookupProductIds.size > 0
            ? await tx.product.findMany({
                where: {
                  id: {
                    in: Array.from(preparationLookupProductIds),
                  },
                },
                select: {
                  id: true,
                  name: true,
                  categoryId: true,
                  itemType: true,
                  translations: true,
                },
              })
            : [];
        const preparationLookupProductById = new Map(
          preparationLookupProducts.map((product) => [product.id, product]),
        );
        const comboIdsForDirectProducts = Array.from(
          new Set(
            data.cart.items
              .map((item) => item.productId)
              .filter((productId) => {
                const catalogProduct = getCatalogProductById(productId)?.product;
                const fallbackProduct = preparationLookupProductById.get(productId);

                return (
                  catalogProduct?.itemType === "COMBO" ||
                  fallbackProduct?.itemType === "COMBO"
                );
              }),
          ),
        );
        const directComboProductRows = await getComboProductsByComboIds(
          tx,
          comboIdsForDirectProducts,
        );
        const directComboProductsByComboId = new Map<
          string,
          DirectComboProductForPrep[]
        >();
        for (const row of directComboProductRows) {
          const current = directComboProductsByComboId.get(row.comboId) ?? [];
          current.push({
            productId: row.productId,
            quantity: row.quantity,
          });
          directComboProductsByComboId.set(row.comboId, current);
        }
        for (const row of directComboProductRows) {
          preparationLookupProductIds.add(row.productId);
        }
        const missingDirectProductIds = Array.from(
          new Set(
            directComboProductRows
              .map((row) => row.productId)
              .filter(
                (productId) => !preparationLookupProductById.has(productId),
              ),
          ),
        );
        if (missingDirectProductIds.length > 0) {
          const missingDirectProducts = await tx.product.findMany({
            where: {
              id: {
                in: missingDirectProductIds,
              },
            },
            select: {
              id: true,
              name: true,
              categoryId: true,
              itemType: true,
              translations: true,
            },
          });

          for (const product of missingDirectProducts) {
            preparationLookupProductById.set(product.id, product);
          }
        }
        const productIdsForCategoryFallback = Array.from(
          preparationLookupProductById.keys(),
        );
        const productCategoryFallbackRows =
          productIdsForCategoryFallback.length > 0
            ? await tx.$queryRaw<
                { productId: string; categoryId: string }[]
              >`
                SELECT DISTINCT ON ("productId")
                  "productId",
                  "categoryId"
                FROM "ProductCategory"
                WHERE "productId" IN (${Prisma.join(productIdsForCategoryFallback)})
                ORDER BY
                  "productId" ASC,
                  COALESCE("categoryIndex", 2147483647) ASC,
                  "createdAt" ASC
              `
            : [];
        const categoryFallbackByProductId = new Map(
          productCategoryFallbackRows.map((row) => [row.productId, row.categoryId]),
        );
        const resolvePreparationCategoryId = (
          productId: string,
          primaryCategoryId?: string | null,
          secondaryCategoryId?: string | null,
        ): string | null =>
          primaryCategoryId ??
          secondaryCategoryId ??
          categoryFallbackByProductId.get(productId) ??
          null;

        const comboPreparationOrderProducts: TOrderProduct[] = [];
        for (const cartItem of data.cart.items) {
          const comboCatalogProduct = getCatalogProductById(cartItem.productId)?.product;
          const comboProduct =
            comboCatalogProduct ?? preparationLookupProductById.get(cartItem.productId);
          if (!comboProduct || comboProduct.itemType !== "COMBO") continue;

          const parentQuantity =
            typeof cartItem.quantity === "number" &&
            Number.isInteger(cartItem.quantity) &&
            cartItem.quantity > 0
              ? cartItem.quantity
              : 1;

          if (
            !Array.isArray(cartItem.comboSelections) ||
            cartItem.comboSelections.length === 0
          ) {
            const fixedComboProducts =
              directComboProductsByComboId.get(cartItem.productId) ?? [];

            for (const fixedComboProduct of fixedComboProducts) {
              if (fixedComboProduct.quantity <= 0) continue;

              const fixedProductCatalog = getCatalogProductById(
                fixedComboProduct.productId,
              );
              const fixedProduct =
                fixedProductCatalog?.product ??
                preparationLookupProductById.get(fixedComboProduct.productId);
              if (!fixedProduct) continue;

              const fixedProductCategoryId = resolvePreparationCategoryId(
                fixedProduct.id,
                fixedProduct.categoryId,
                fixedProductCatalog?.categoryId,
              );
              if (!fixedProductCategoryId) continue;

              comboPreparationOrderProducts.push({
                id: randomUUID(),
                amount: 0,
                fullAmount: 0,
                productId: fixedProduct.id,
                quantity: parentQuantity * fixedComboProduct.quantity,
                selectedModifierGroupItemIds: [],
                product: {
                  id: fixedProduct.id,
                  name: fixedProduct.name,
                  categoryId: fixedProductCategoryId,
                  preparationStep: [],
                },
              });
            }

            continue;
          }

          for (const selection of cartItem.comboSelections) {
            const selectionQuantity =
              typeof selection.quantity === "number" &&
              Number.isInteger(selection.quantity) &&
              selection.quantity > 0
                ? selection.quantity
                : 0;
            if (selectionQuantity <= 0) continue;

            const selectedProductCatalog = getCatalogProductById(
              selection.optionProductId,
            );
            const selectedProduct =
              selectedProductCatalog?.product ??
              preparationLookupProductById.get(selection.optionProductId);
            if (!selectedProduct) continue;

            const selectedProductCategoryId = resolvePreparationCategoryId(
              selectedProduct.id,
              selectedProduct.categoryId,
              selectedProductCatalog?.categoryId,
            );
            if (!selectedProductCategoryId) continue;

            comboPreparationOrderProducts.push({
              id: randomUUID(),
              amount: 0,
              fullAmount: 0,
              productId: selectedProduct.id,
              quantity: parentQuantity * selectionQuantity,
              selectedModifierGroupItemIds: [],
              product: {
                id: selectedProduct.id,
                name: selectedProduct.name,
                categoryId: selectedProductCategoryId,
                preparationStep: [],
              },
            });
          }
        }
        const prizePreparationOrderProducts: TOrderProduct[] = [];
        if (selectedPrizeSnapshot) {
          for (const selectedPrizeProduct of selectedPrizeSnapshot.selectedProductCounts) {
            if (selectedPrizeProduct.quantity <= 0) continue;

            const catalogProduct = getCatalogProductById(selectedPrizeProduct.productId);
            const prizeProduct =
              catalogProduct?.product ??
              preparationLookupProductById.get(selectedPrizeProduct.productId);
            if (!prizeProduct) continue;

            const categoryId = resolvePreparationCategoryId(
              prizeProduct.id,
              prizeProduct.categoryId,
              catalogProduct?.categoryId,
            );
            if (!categoryId) continue;

            prizePreparationOrderProducts.push({
              id: randomUUID(),
              amount: 0,
              fullAmount: 0,
              productId: selectedPrizeProduct.productId,
              quantity: selectedPrizeProduct.quantity,
              selectedModifierGroupItemIds: [],
              product: {
                id: prizeProduct.id,
                name: prizeProduct.name,
                categoryId,
                preparationStep: [],
              },
            });
          }
        }
        const rewardPreparationOrderProducts: TOrderProduct[] = [];
        for (const [rewardProductId, rewardQuantity] of redeemedRewardProductCountsMap) {
          if (rewardQuantity <= 0) continue;

          const catalogProduct = getCatalogProductById(rewardProductId);
          const rewardProduct =
            catalogProduct?.product ??
            preparationLookupProductById.get(rewardProductId);
          if (!rewardProduct) continue;

          const categoryId = resolvePreparationCategoryId(
            rewardProduct.id,
            rewardProduct.categoryId,
            catalogProduct?.categoryId,
          );
          if (!categoryId) continue;

          rewardPreparationOrderProducts.push({
            id: randomUUID(),
            amount: 0,
            fullAmount: 0,
            productId: rewardProductId,
            quantity: rewardQuantity,
            selectedModifierGroupItemIds: [],
            product: {
              id: rewardProduct.id,
              name: rewardProduct.name,
              categoryId,
              preparationStep: [],
            },
          });
        }
        const order: TOrder = {
          id: createdOrder.id,
          createdAt: createdOrder.createdAt.toISOString(),
          scheduleFor: scheduleFor?.toISOString() ?? null,
          language: language ?? null,
          paidAt: createdOrder.paidAt ? createdOrder.paidAt.toISOString() : null,
          status: "ACCEPTED",
          tip: sanitizedTipPercentage,
          tipAmount: sanitizedTipPercentage,
          orderProducts,
          paymentMethod: createdOrder.paymentMethod,
          ...(paymentProvider ? { paymentProvider } : {}),
          type: createdOrder.type,
          preparationTaskStation: [],
        };
        const orderForPreparationSteps =
          comboPreparationOrderProducts.length > 0 ||
          prizePreparationOrderProducts.length > 0 ||
          rewardPreparationOrderProducts.length > 0
            ? {
                ...order,
                orderProducts: [
                  ...order.orderProducts,
                  ...comboPreparationOrderProducts,
                  ...prizePreparationOrderProducts,
                  ...rewardPreparationOrderProducts,
                ],
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

  let stripePaymentIntentId: string | null = null;
  if (shouldChargeWithStripe) {
    const chargedPayment = await chargeStripeCard();
    stripePaymentIntentId = chargedPayment.paymentIntentId;
    markCheckoutTimingStep("stripe-charge");
  }

  let transactionResult: OrderCreationTransactionResult | null = null;
  let transactionFailureError: unknown = null;
  let attempt = 0;

  while (attempt < MAX_ORDER_CREATION_TRANSACTION_RETRIES) {
    try {
      console.log(`[createOrder] transaction attempt ${attempt + 1}`);
      transactionResult = await runOrderCreationTransaction();
      markCheckoutTimingStep("db-transaction");
      console.log('[createOrder] transaction succeeded');
      break;
    } catch (error) {
      attempt += 1;
      transactionFailureError = error;
      console.error(`[createOrder] transaction attempt ${attempt} failed`, error);
      const canRetry =
        attempt < MAX_ORDER_CREATION_TRANSACTION_RETRIES &&
        isRetryableOrderCreationTransactionError(error);

      if (!canRetry) {
        break;
      }
    }
  }

  if (!transactionResult) {
    if (stripePaymentIntentId) {
      await refundStripeCharge(stripePaymentIntentId);
      markCheckoutTimingStep("stripe-refund");
      flushCheckoutTiming("FAILED", "ORDER_CREATION_FAILED_AFTER_CHARGE_REFUNDED");
      throw {
        code: "ORDER_CREATION_FAILED_AFTER_CHARGE_REFUNDED",
        data: {
          message: "ORDER_CREATION_FAILED_AFTER_CHARGE_REFUNDED",
        },
      };
    }

    if (transactionFailureError) {
      flushCheckoutTiming("FAILED", "ORDER_CREATION_TRANSACTION_FAILED");
      console.error('[createOrder] throwing transactionFailureError', transactionFailureError);
      throw transactionFailureError;
    }

    flushCheckoutTiming("FAILED", "ORDER_CREATION_TRANSACTION_FAILED");
    throw new Error("ORDER_CREATION_TRANSACTION_FAILED");
  }

  let customerContact: CustomerContactRow | null = null;
  if (transactionResult.customerId) {
    try {
      const [resolvedCustomerContact] = await prisma.$queryRaw<CustomerContactRow[]>`
          SELECT "name", "phone"
          FROM "Customer"
          WHERE "id" = ${transactionResult.customerId}
          LIMIT 1
        `;
      customerContact = resolvedCustomerContact ?? null;
    } catch (error) {
      console.error("Failed to resolve order customer contact:", error);
    }
  }

  if (data.orderType === "DELIVERY" && data.addressId) {
    after(async () => {
      await triggerDispatchQueueRun({
        orderId: transactionResult.orderId,
      }).catch((error: unknown) => {
        console.error("Failed to trigger dispatch assignment processing:", error);
      });

      await ensureDeliveryOrderHasDispatch({
        orderId: transactionResult.orderId,
        deliveryAddressId: data.addressId!,
      }).catch((error: unknown) => {
        console.error(
          "Failed to ensure delivery order dispatch assignment:",
          error,
        );
      });
    });
  }
  markCheckoutTimingStep("dispatch-post-processing-queued");

  const customerName = customerContact?.name ?? null;
  const customerPhone = customerContact?.phone;

  if (customerPhone) {
    after(async () => {
      await sendOrderConfirmationWhatsAppMessage({
        language: language ?? null,
        customerName,
        customerPhone,
        orderNumber: transactionResult.orderNumber,
        totalInCents: orderTotalInCents,
        orderType: data.orderType,
      });
    });
  }

  let redeemedRewardsByOrderId: RedeemedRewardsByOrderId = new Map();
  try {
    redeemedRewardsByOrderId = await getRedeemedRewardsByOrderIds([
      transactionResult.orderId,
    ]);
  } catch (error) {
    console.error("Failed to load redeemed rewards for created order:", error);
  }
  markCheckoutTimingStep("rewards-fetch");

  const orderResponse = {
    ...transactionResult.order,
    redeemedRewards:
      redeemedRewardsByOrderId.get(transactionResult.orderId) || [],
  };
  flushCheckoutTiming("SUCCESS");

  return orderResponse;
};

export default createOrder;
