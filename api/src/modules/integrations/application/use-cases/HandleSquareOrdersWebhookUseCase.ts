import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import type { SquareOrdersGateway } from "../ports/SquareOrdersGateway.js";

type HandleSquareOrdersWebhookInput = {
  accessToken?: string | null;
  eventType: string | null;
  squareOrderId: string | null;
};

type SquareMoneyLike = {
  amount?: number | null;
};

type SquareOrderLineItemModifierLike = {
  catalog_object_id?: string | null;
  name?: string | null;
};

type SquareOrderLineItemLike = {
  base_price_money?: SquareMoneyLike | null;
  catalog_object_id?: string | null;
  modifiers?: SquareOrderLineItemModifierLike[] | null;
  name?: string | null;
  note?: string | null;
  quantity?: string | null;
  total_money?: SquareMoneyLike | null;
  uid?: string | null;
};

type SquareFulfillmentRecipientLike = {
  display_name?: string | null;
  email_address?: string | null;
  phone_number?: string | null;
};

type SquareFulfillmentLike = {
  delivery_details?: {
    recipient?: SquareFulfillmentRecipientLike | null;
  } | null;
  pickup_details?: {
    pickup_at?: string | null;
    recipient?: SquareFulfillmentRecipientLike | null;
  } | null;
};

type SquareOrderLike = {
  closed_at?: string | null;
  created_at?: string | null;
  creation_source?: {
    name?: string | null;
  } | null;
  customer_id?: string | null;
  fulfillments?: SquareFulfillmentLike[] | null;
  id?: string | null;
  line_items?: SquareOrderLineItemLike[] | null;
  location_id?: string | null;
  reference_id?: string | null;
  source?: {
    name?: string | null;
  } | null;
  state?: string | null;
  total_money?: SquareMoneyLike | null;
  total_tip_money?: SquareMoneyLike | null;
};

type SquareCustomerLike = {
  company_name?: string | null;
  email_address?: string | null;
  family_name?: string | null;
  given_name?: string | null;
  nickname?: string | null;
  phone_number?: string | null;
};

type SquareImportLineItem = {
  comments: string | null;
  modifierGroupItemIds: string[];
  productId: string;
  quantity: number;
  unitAmount: number;
  unitFullAmount: number;
};

type ImportedOrderCustomerDetails = {
  customerId: string | null;
  customerNameSnapshot: string | null;
};

type PreparationStepDefinition = {
  goalMinutes: number;
  id: string;
  includeComments: boolean;
  includeModifiers: boolean;
  name: string;
  productIds: string[];
  stationId: string;
};

type ProductItemType = "PRODUCT" | "COMBO";

type PreparationTrackModifier = {
  completed: boolean;
  id: string;
  modifierGroupItem: string;
};

type PreparationTrack = {
  comments?: string;
  completed: boolean;
  completedAt?: string;
  completedComments: boolean;
  expectedAt?: string;
  goalMinutes: number;
  id: string;
  name: string;
  preparationStepCategoryId: string;
  preparationStepId: string;
  preparationStepModifiers?: PreparationTrackModifier[];
  quantity: number;
};

type PreparationTaskStation = {
  completed: boolean;
  id: string;
  orderId: string;
  snoozes: unknown[];
  stationId: string;
  steps: PreparationTrack[];
};

const ORDER_CREATION_TRANSACTION_MAX_WAIT_MS = 10_000;
const ORDER_CREATION_TRANSACTION_TIMEOUT_MS = 20_000;

export class HandleSquareOrdersWebhookUseCase {
  constructor(private readonly squareOrdersGateway: SquareOrdersGateway) {}

  async execute(input: HandleSquareOrdersWebhookInput): Promise<{
    action: "ignored" | "imported" | "updated";
    eventType: string | null;
    foodyOrderId: string | null;
    reason?: string;
    squareOrderId: string | null;
  }> {
    const normalizedSquareOrderId = input.squareOrderId?.trim() ?? "";
    if (!normalizedSquareOrderId) {
      return {
        action: "ignored",
        eventType: input.eventType,
        foodyOrderId: null,
        reason: "MISSING_ORDER_ID",
        squareOrderId: null,
      };
    }

    if (input.eventType !== "order.created" && input.eventType !== "order.updated") {
      return {
        action: "ignored",
        eventType: input.eventType,
        foodyOrderId: null,
        reason: "UNSUPPORTED_EVENT_TYPE",
        squareOrderId: normalizedSquareOrderId,
      };
    }

    const retrieved = await this.squareOrdersGateway.retrieveOrder({
      accessToken: input.accessToken ?? undefined,
      orderId: normalizedSquareOrderId,
    });
    const squareOrder = asSquareOrder(retrieved.order);

    if (!squareOrder?.id?.trim()) {
      throw new Error(`SQUARE_ORDER_NOT_FOUND: ${normalizedSquareOrderId}`);
    }

    const sourceName = normalizeSourceName(
      squareOrder.creation_source?.name ?? squareOrder.source?.name ?? null,
    );
    if (sourceName === "FOODY") {
      return {
        action: "ignored",
        eventType: input.eventType,
        foodyOrderId: null,
        reason: "FOODY_ORIGIN",
        squareOrderId: squareOrder.id,
      };
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        externalId: squareOrder.id,
      },
      select: {
        createdAt: true,
        id: true,
        dispatchId: true,
        type: true,
      },
    });

    if (existingOrder) {
      const customerDetails = await resolveImportedOrderCustomerDetails(
        squareOrder,
        this.squareOrdersGateway,
        input.accessToken ?? undefined,
      );
      await syncExistingFoodyOrderFromSquare(existingOrder, squareOrder, customerDetails);
      return {
        action: "updated",
        eventType: input.eventType,
        foodyOrderId: existingOrder.id,
        squareOrderId: squareOrder.id,
      };
    }

    const customerDetails = await resolveImportedOrderCustomerDetails(
      squareOrder,
      this.squareOrdersGateway,
      input.accessToken ?? undefined,
    );
    const importedOrder = await createFoodyOrderFromSquare(squareOrder, customerDetails);
    return {
      action: "imported",
      eventType: input.eventType,
      foodyOrderId: importedOrder.foodyOrderId,
      squareOrderId: squareOrder.id,
    };
  }
}

function asSquareOrder(value: unknown): SquareOrderLike | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as SquareOrderLike;
}

async function syncExistingFoodyOrderFromSquare(
  existingOrder: {
    createdAt: Date;
    dispatchId: string | null;
    id: string;
    type: string | null;
  },
  squareOrder: SquareOrderLike,
  customerDetails: ImportedOrderCustomerDetails,
): Promise<void> {
  const squareState = normalizeSquareOrderState(squareOrder.state);
  const paidAt = resolveSquarePaidAt(squareOrder);
  const sourcePlatform = resolveSquareSourcePlatform(squareOrder);

  await prisma.$transaction(async (tx) => {
    const orderUpdateData: Prisma.OrderUncheckedUpdateInput = {
      canceled: squareState === "CANCELED",
      customerId: customerDetails.customerId,
      customerNameSnapshot: customerDetails.customerNameSnapshot,
      deliveredAt: null,
      paidAt,
      sourcePlatform,
    };

    await tx.order.update({
      where: {
        id: existingOrder.id,
      },
      data: orderUpdateData,
    });

    const existingPayment = await tx.orderPayment.findFirst({
      where: {
        orderId: existingOrder.id,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
      },
    });

    const totalAmount = resolveSquareTotalAmount(squareOrder);

    if (existingPayment?.id) {
      await tx.orderPayment.update({
        where: {
          id: existingPayment.id,
        },
        data: {
          amount: totalAmount,
          externalId: squareOrder.id ?? null,
          paidAt,
        },
      });
    } else {
      await tx.orderPayment.create({
        data: {
          id: randomUUID(),
          orderId: existingOrder.id,
          amount: totalAmount,
          paidAt,
          paymentType: "CARD",
          paymentProvider: null,
          externalId: squareOrder.id ?? null,
        },
      });
    }

    await ensurePreparationTasksForSquareOrderTx(tx, {
      orderCreatedAt: existingOrder.createdAt,
      orderId: existingOrder.id,
    });

    if (!existingOrder.dispatchId && existingOrder.type === "TAKEAWAY") {
      const dispatchId = await createDispatchForImportedTakeawayOrder(tx, {
        completedAt: null,
      });

      await tx.order.update({
        where: {
          id: existingOrder.id,
        },
        data: {
          dispatchId,
          dispatchOrderIndex: 1,
        },
      });
    }

    if (existingOrder.dispatchId) {
      await tx.dispatch.update({
        where: {
          id: existingOrder.dispatchId,
        },
        data: {
          completedAt: null,
        },
      });
    }
  });
}

async function createFoodyOrderFromSquare(
  squareOrder: SquareOrderLike,
  customerDetails: ImportedOrderCustomerDetails,
): Promise<{
  foodyOrderId: string;
}> {
  const squareOrderId = squareOrder.id?.trim();
  if (!squareOrderId) {
    throw new Error("SQUARE_ORDER_ID_MISSING");
  }

  const importedLineItems = await resolveSquareImportLineItems(squareOrder);
  if (importedLineItems.length === 0) {
    throw new Error(`SQUARE_ORDER_HAS_NO_MAPPED_ITEMS: ${squareOrderId}`);
  }

  const branchId = await resolveImportedOrderBranchId();
  const orderId = randomUUID();
  const orderNumber = buildReadableOrderNumber();
  const orderCreatedAt = parseDateOrNow(squareOrder.created_at);
  const paidAt = resolveSquarePaidAt(squareOrder);
  const scheduleFor = resolveSquareScheduledAt(squareOrder);
  const totalAmount = resolveSquareTotalAmount(squareOrder);
  const tipAmount = resolveSquareTipAmount(squareOrder);
  const sourcePlatform = resolveSquareSourcePlatform(squareOrder);
  const preparationStepDefinitions = await getPreparationStepDefinitions(prisma);

  await prisma.$transaction(
    async (tx) => {
      const orderCreateData: Prisma.OrderUncheckedCreateInput = {
        id: orderId,
        number: orderNumber,
        createdAt: orderCreatedAt,
        amount: totalAmount,
        type: "TAKEAWAY",
        paymentMethod: "CARD",
        paymentProvider: null,
        customerId: customerDetails.customerId,
        customerNameSnapshot: customerDetails.customerNameSnapshot,
        sourcePlatform,
        tipAmount,
        scheduleFor,
        paidAt,
        externalId: squareOrderId,
        branchId: branchId ?? null,
        tags: buildImportedOrderTags(squareOrder),
        canceled: normalizeSquareOrderState(squareOrder.state) === "CANCELED",
      };

      await tx.order.create({
        data: orderCreateData,
      });

      for (const item of importedLineItems) {
        await tx.orderProducts.create({
          data: {
            id: randomUUID(),
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            comments: item.comments,
            amount: item.unitAmount,
            fullAmount: item.unitFullAmount,
            ...(item.modifierGroupItemIds.length > 0
              ? {
                  modifierGroupItems: {
                    connect: item.modifierGroupItemIds.map((id) => ({ id })),
                  },
                }
              : {}),
          },
        });
      }

      await createPreparationStepCategoriesForOrderTx(
        tx,
        {
          cartItems: importedLineItems.map((item) => ({
            comments: item.comments,
            comboSelections: [],
            description: item.comments ?? undefined,
            modifiers: item.modifierGroupItemIds.map((modifierItemId) => ({
              modifierItemId,
            })),
            productId: item.productId,
            quantity: item.quantity,
          })),
          orderCreatedAt,
          orderId,
          orderProducts: importedLineItems.map((item) => ({
            comments: item.comments,
            productId: item.productId,
            quantity: item.quantity,
            selectedModifierGroupItemIds: item.modifierGroupItemIds,
          })),
          productById: new Map(
            importedLineItems.map((item) => [
              item.productId,
              {
                id: item.productId,
                itemType: "PRODUCT" as ProductItemType,
              },
            ]),
          ),
        },
        preparationStepDefinitions,
      );

      const dispatchId = await createDispatchForImportedTakeawayOrder(tx, {
        completedAt: null,
      });

      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          dispatchId,
          dispatchOrderIndex: 1,
        },
      });

      await tx.orderPayment.create({
        data: {
          id: randomUUID(),
          orderId,
          amount: totalAmount,
          paidAt,
          paymentType: "CARD",
          paymentProvider: null,
          externalId: squareOrderId,
        },
      });
    },
    {
      maxWait: ORDER_CREATION_TRANSACTION_MAX_WAIT_MS,
      timeout: ORDER_CREATION_TRANSACTION_TIMEOUT_MS,
    },
  );

  return {
    foodyOrderId: orderId,
  };
}

async function ensurePreparationTasksForSquareOrderTx(
  tx: Prisma.TransactionClient,
  input: {
    orderCreatedAt: Date;
    orderId: string;
  },
): Promise<void> {
  const existingCategoryCount = await tx.preparationStepCategory.count({
    where: {
      orderId: input.orderId,
    },
  });

  if (existingCategoryCount > 0) {
    return;
  }

  const [preparationStepDefinitions, orderProducts] = await Promise.all([
    getPreparationStepDefinitions(tx),
    tx.orderProducts.findMany({
      where: {
        orderId: input.orderId,
      },
      include: {
        modifierGroupItems: {
          select: {
            id: true,
          },
        },
        product: {
          select: {
            id: true,
            itemType: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  if (orderProducts.length === 0 || preparationStepDefinitions.length === 0) {
    return;
  }

  await createPreparationStepCategoriesForOrderTx(
    tx,
    {
      cartItems: orderProducts.map((item) => ({
        comboSelections: [],
        comments: item.comments,
        description: item.comments ?? undefined,
        modifiers: item.modifierGroupItems.map((modifierItem) => ({
          modifierItemId: modifierItem.id,
        })),
        productId: item.productId,
        quantity: item.quantity,
      })),
      orderCreatedAt: input.orderCreatedAt,
      orderId: input.orderId,
      orderProducts: orderProducts.map((item) => ({
        comments: item.comments,
        productId: item.productId,
        quantity: item.quantity,
        selectedModifierGroupItemIds: item.modifierGroupItems.map(
          (modifierItem) => modifierItem.id,
        ),
      })),
      productById: new Map(
        orderProducts.map((item) => [
          item.productId,
          {
            id: item.product.id,
            itemType: item.product.itemType as ProductItemType,
          },
        ]),
      ),
    },
    preparationStepDefinitions,
  );
}

async function createDispatchForImportedTakeawayOrder(
  tx: Prisma.TransactionClient,
  input: {
    completedAt: Date | null;
  },
): Promise<string> {
  const dispatchId = randomUUID();
  const [nextQueueIndexResult] = await tx.$queryRaw<
    { nextQueueIndex: number }[]
  >`
    SELECT COALESCE(MAX(dispatch."queueIndex"), 0)::INTEGER + 1 AS "nextQueueIndex"
    FROM "Dispatch" dispatch
  `;
  const nextQueueIndex = nextQueueIndexResult?.nextQueueIndex ?? 1;

  await tx.dispatch.create({
    data: {
      id: dispatchId,
      queueIndex: nextQueueIndex,
      dispatched: false,
      dispatchAt: null,
      driverId: null,
      completedAt: input.completedAt,
    },
  });

  return dispatchId;
}

async function resolveSquareImportLineItems(
  squareOrder: SquareOrderLike,
): Promise<SquareImportLineItem[]> {
  const lineItems = Array.isArray(squareOrder.line_items) ? squareOrder.line_items : [];
  if (lineItems.length === 0) {
    return [];
  }

  const variationIds = Array.from(
    new Set(
      lineItems
        .map((lineItem) => lineItem.catalog_object_id?.trim() ?? "")
        .filter(Boolean),
    ),
  );
  const modifierIds = Array.from(
    new Set(
      lineItems.flatMap((lineItem) =>
        (lineItem.modifiers ?? [])
          .map((modifier) => modifier.catalog_object_id?.trim() ?? "")
          .filter(Boolean),
      ),
    ),
  );

  const [products, modifierItems] = await Promise.all([
    prisma.product.findMany({
      where: {
        squareVariationId: {
          in: variationIds,
        },
      },
      select: {
        id: true,
        name: true,
        squareVariationId: true,
      },
    }),
    prisma.modifierGroupItem.findMany({
      where: {
        squareModifierId: {
          in: modifierIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        squareModifierId: true,
      },
    }),
  ]);

  const productByVariationId = new Map(
    products
      .filter((product): product is typeof product & { squareVariationId: string } =>
        Boolean(product.squareVariationId?.trim()),
      )
      .map((product) => [product.squareVariationId.trim(), product]),
  );
  const modifierBySquareId = new Map(
    modifierItems
      .filter(
        (
          modifierItem,
        ): modifierItem is typeof modifierItem & { squareModifierId: string } =>
          Boolean(modifierItem.squareModifierId?.trim()),
      )
      .map((modifierItem) => [modifierItem.squareModifierId.trim(), modifierItem]),
  );

  const resolvedItems: SquareImportLineItem[] = [];

  for (const lineItem of lineItems) {
    const variationId = lineItem.catalog_object_id?.trim();
    if (!variationId) {
      throw new Error(`SQUARE_ORDER_LINE_ITEM_VARIATION_MISSING: ${lineItem.uid ?? "unknown"}`);
    }

    const product = productByVariationId.get(variationId);
    if (!product) {
      throw new Error(
        `SQUARE_ORDER_PRODUCT_MAPPING_MISSING: variation ${variationId} (${lineItem.name ?? "unknown"})`,
      );
    }

    const quantity = parsePositiveInteger(lineItem.quantity, `line item ${lineItem.uid ?? variationId}`);
    const modifierGroupItems = (lineItem.modifiers ?? []).map((modifier) => {
      const squareModifierId = modifier.catalog_object_id?.trim();
      if (!squareModifierId) {
        throw new Error(
          `SQUARE_ORDER_MODIFIER_MAPPING_MISSING: missing modifier catalog_object_id for line item ${lineItem.uid ?? variationId}`,
        );
      }

      const mappedModifier = modifierBySquareId.get(squareModifierId);
      if (!mappedModifier) {
        throw new Error(
          `SQUARE_ORDER_MODIFIER_MAPPING_MISSING: modifier ${squareModifierId} (${modifier.name ?? "unknown"})`,
        );
      }

      return mappedModifier;
    });

    const unitBaseAmount = resolveSquareUnitBaseAmount(lineItem, quantity);
    const unitModifierAmount = modifierGroupItems.reduce(
      (sum, modifierItem) => sum + modifierItem.price,
      0,
    );

    resolvedItems.push({
      productId: product.id,
      quantity,
      comments: normalizeOptionalString(lineItem.note),
      modifierGroupItemIds: Array.from(
        new Set(modifierGroupItems.map((modifierItem) => modifierItem.id)),
      ),
      unitAmount: unitBaseAmount + unitModifierAmount,
      unitFullAmount: unitBaseAmount + unitModifierAmount,
    });
  }

  return resolvedItems;
}

function resolveSquareUnitBaseAmount(
  lineItem: SquareOrderLineItemLike,
  quantity: number,
): number {
  const baseAmount = normalizeMoneyAmount(lineItem.base_price_money?.amount);
  if (baseAmount !== null) {
    return baseAmount;
  }

  const totalAmount = normalizeMoneyAmount(lineItem.total_money?.amount);
  if (totalAmount !== null) {
    return Math.max(0, Math.round(totalAmount / Math.max(quantity, 1)));
  }

  return 0;
}

function buildImportedOrderTags(squareOrder: SquareOrderLike): string[] {
  const tags = ["SQUARE", "SQUARE_IMPORT"];
  const sourceName = normalizeSourceName(
    squareOrder.creation_source?.name ?? squareOrder.source?.name ?? null,
  );

  if (sourceName) {
    tags.push(sourceName);
  }

  return Array.from(new Set(tags));
}

async function resolveImportedOrderBranchId(): Promise<string | null> {
  const configuredBranchId = normalizeOptionalString(
    process.env.SQUARE_IMPORTED_ORDER_BRANCH_ID ?? null,
  );
  if (configuredBranchId) {
    return configuredBranchId;
  }

  const branches = await prisma.branch.findMany({
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 2,
  });

  if (branches.length === 1) {
    return branches[0]!.id;
  }

  return null;
}

async function resolveImportedOrderCustomerDetails(
  squareOrder: SquareOrderLike,
  squareOrdersGateway: SquareOrdersGateway,
  accessToken?: string,
): Promise<ImportedOrderCustomerDetails> {
  const recipient = resolveSquareRecipient(squareOrder);
  const squareCustomer = await resolveSquareCustomer(
    squareOrder,
    squareOrdersGateway,
    accessToken,
  );
  const phone = normalizeOptionalString(
    recipient?.phone_number ?? squareCustomer?.phone_number ?? null,
  );
  const email = normalizeOptionalString(
    recipient?.email_address ?? squareCustomer?.email_address ?? null,
  );
  const name = normalizeOptionalString(
    recipient?.display_name ?? resolveSquareCustomerDisplayName(squareCustomer) ?? null,
  );

  if (!name && !phone) {
    return {
      customerId: null,
      customerNameSnapshot: null,
    };
  }

  if (!phone) {
    return {
      customerId: null,
      customerNameSnapshot: name ?? null,
    };
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      OR: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
    select: {
      id: true,
    },
  });

  if (existingCustomer?.id) {
    return {
      customerId: existingCustomer.id,
      customerNameSnapshot: name ?? null,
    };
  }

  const createdCustomer = await prisma.customer.create({
    data: {
      id: randomUUID(),
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
    },
    select: {
      id: true,
    },
  });

  return {
    customerId: createdCustomer.id,
    customerNameSnapshot: name ?? null,
  };
}

async function resolveSquareCustomer(
  squareOrder: SquareOrderLike,
  squareOrdersGateway: SquareOrdersGateway,
  accessToken?: string,
): Promise<SquareCustomerLike | null> {
  const squareCustomerId = normalizeOptionalString(squareOrder.customer_id ?? null);
  if (!squareCustomerId) {
    return null;
  }

  try {
    const retrieved = await squareOrdersGateway.retrieveCustomer({
      accessToken,
      customerId: squareCustomerId,
    });

    return asSquareCustomer(retrieved.customer);
  } catch {
    return null;
  }
}

function asSquareCustomer(value: unknown): SquareCustomerLike | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as SquareCustomerLike;
}

function resolveSquareCustomerDisplayName(
  customer: SquareCustomerLike | null,
): string | null {
  if (!customer) {
    return null;
  }

  const fullName = [
    normalizeOptionalString(customer.given_name ?? null),
    normalizeOptionalString(customer.family_name ?? null),
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  return (
    normalizeOptionalString(customer.nickname ?? null) ??
    normalizeOptionalString(customer.company_name ?? null) ??
    null
  );
}

function resolveSquareRecipient(
  squareOrder: SquareOrderLike,
): SquareFulfillmentRecipientLike | null {
  const fulfillments = Array.isArray(squareOrder.fulfillments)
    ? squareOrder.fulfillments
    : [];

  for (const fulfillment of fulfillments) {
    const pickupRecipient = fulfillment.pickup_details?.recipient;
    if (pickupRecipient) {
      return pickupRecipient;
    }

    const deliveryRecipient = fulfillment.delivery_details?.recipient;
    if (deliveryRecipient) {
      return deliveryRecipient;
    }
  }

  return null;
}

function resolveSquareScheduledAt(squareOrder: SquareOrderLike): Date | null {
  const fulfillments = Array.isArray(squareOrder.fulfillments)
    ? squareOrder.fulfillments
    : [];

  for (const fulfillment of fulfillments) {
    const pickupAt = fulfillment.pickup_details?.pickup_at;
    if (pickupAt) {
      return parseDateOrNull(pickupAt);
    }
  }

  return null;
}

function resolveSquarePaidAt(squareOrder: SquareOrderLike): Date | null {
  const normalizedState = normalizeSquareOrderState(squareOrder.state);
  if (normalizedState !== "COMPLETED") {
    return null;
  }

  return parseDateOrNull(squareOrder.closed_at) ?? parseDateOrNow(squareOrder.created_at);
}

function resolveSquareSourcePlatform(
  squareOrder: SquareOrderLike,
): "DOORDASH" | "UBER_EATS" | "SQUARE" {
  const sourceName = normalizeSourceName(
    squareOrder.creation_source?.name ?? squareOrder.source?.name ?? null,
  );

  if (sourceName?.includes("DOORDASH")) {
    return "DOORDASH";
  }

  if (sourceName?.includes("UBER")) {
    return "UBER_EATS";
  }

  return "SQUARE";
}

function resolveSquareTakeawayCompletedAt(squareOrder: SquareOrderLike): Date | null {
  const normalizedState = normalizeSquareOrderState(squareOrder.state);
  if (normalizedState !== "COMPLETED") {
    return null;
  }

  return parseDateOrNull(squareOrder.closed_at) ?? parseDateOrNow(squareOrder.created_at);
}

function resolveSquareTotalAmount(squareOrder: SquareOrderLike): number {
  const total = normalizeMoneyAmount(squareOrder.total_money?.amount);
  if (total !== null) {
    return total;
  }

  const lineItems = Array.isArray(squareOrder.line_items) ? squareOrder.line_items : [];

  return lineItems.reduce((sum, lineItem) => {
    const quantity = parsePositiveInteger(lineItem.quantity, `line item ${lineItem.uid ?? "unknown"}`);
    const lineTotal = normalizeMoneyAmount(lineItem.total_money?.amount);
    if (lineTotal !== null) {
      return sum + lineTotal;
    }

    return sum + resolveSquareUnitBaseAmount(lineItem, quantity) * quantity;
  }, 0);
}

function resolveSquareTipAmount(squareOrder: SquareOrderLike): number | null {
  const amount = normalizeMoneyAmount(squareOrder.total_tip_money?.amount);
  return amount === null ? null : amount;
}

function normalizeSquareOrderState(state: string | null | undefined): string | null {
  const normalized = normalizeOptionalString(state ?? null);
  return normalized ? normalized.toUpperCase() : null;
}

function normalizeSourceName(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalString(value ?? null);
  return normalized ? normalized.toUpperCase() : null;
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeMoneyAmount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.round(value));
}

function parsePositiveInteger(value: string | null | undefined, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`SQUARE_ORDER_INVALID_QUANTITY: ${label}`);
  }

  return Math.max(1, Math.round(parsed));
}

function parseDateOrNow(value: string | null | undefined): Date {
  return parseDateOrNull(value) ?? new Date();
}

function parseDateOrNull(value: string | null | undefined): Date | null {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

async function createPreparationStepCategoriesForOrderTx(
  tx: Prisma.TransactionClient,
  input: {
    cartItems: Array<{
      comboSelections: Array<{
        optionProductId: string;
        quantity: number;
        slotId: string;
      }>;
      comments?: string | null;
      description?: string;
      modifiers: Array<{
        modifierItemId: string;
      }>;
      productId: string;
      quantity: number;
    }>;
    orderCreatedAt: Date;
    orderId: string;
    orderProducts: Array<{
      comments: string | null;
      productId: string;
      quantity: number;
      selectedModifierGroupItemIds: string[];
    }>;
    productById: Map<
      string,
      {
        id: string;
        itemType: ProductItemType;
      }
    >;
  },
  preparationSteps: PreparationStepDefinition[],
): Promise<void> {
  const preparationOrderProducts: Array<{
    comments?: string;
    productId: string;
    quantity: number;
    selectedModifierGroupItemIds: string[];
  }> = input.orderProducts.map((item) => ({
    comments: item.comments ?? undefined,
    productId: item.productId,
    quantity: item.quantity,
    selectedModifierGroupItemIds: item.selectedModifierGroupItemIds ?? [],
  }));

  const comboIdsWithoutSelections = Array.from(
    new Set(
      input.cartItems
        .filter((cartItem) => {
          const product = input.productById.get(cartItem.productId);
          return (
            product?.itemType === "COMBO" &&
            (!Array.isArray(cartItem.comboSelections) ||
              cartItem.comboSelections.length === 0)
          );
        })
        .map((item) => item.productId),
    ),
  );

  const directComboRows =
    comboIdsWithoutSelections.length > 0
      ? await tx.comboProductItem.findMany({
          where: {
            comboId: {
              in: comboIdsWithoutSelections,
            },
          },
          select: {
            comboId: true,
            productId: true,
            quantity: true,
          },
        })
      : [];

  const directComboProductsByComboId = new Map<
    string,
    Array<{
      productId: string;
      quantity: number;
    }>
  >();

  for (const row of directComboRows) {
    const current = directComboProductsByComboId.get(row.comboId) ?? [];
    current.push({
      productId: row.productId,
      quantity: row.quantity,
    });
    directComboProductsByComboId.set(row.comboId, current);
  }

  for (const cartItem of input.cartItems) {
    const comboProduct = input.productById.get(cartItem.productId);
    if (comboProduct?.itemType !== "COMBO") {
      continue;
    }

    const parentQuantity = cartItem.quantity;

    if (Array.isArray(cartItem.comboSelections) && cartItem.comboSelections.length > 0) {
      for (const selection of cartItem.comboSelections) {
        if (selection.quantity <= 0) continue;

        preparationOrderProducts.push({
          productId: selection.optionProductId,
          quantity: parentQuantity * selection.quantity,
          selectedModifierGroupItemIds: [],
        });
      }
      continue;
    }

    const fixedComboProducts =
      directComboProductsByComboId.get(cartItem.productId) ?? [];

    for (const fixedProduct of fixedComboProducts) {
      if (fixedProduct.quantity <= 0) continue;

      preparationOrderProducts.push({
        productId: fixedProduct.productId,
        quantity: parentQuantity * fixedProduct.quantity,
        selectedModifierGroupItemIds: [],
      });
    }
  }

  const categories = buildPreparationTaskStations(
    {
      id: input.orderId,
      createdAt: input.orderCreatedAt.toISOString(),
      orderProducts: preparationOrderProducts,
    },
    preparationSteps,
  );

  for (const category of categories) {
    await tx.preparationStepCategory.create({
      data: {
        id: category.id,
        stationId: category.stationId ?? null,
        orderId: category.orderId,
        completed: category.completed,
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

async function getPreparationStepDefinitions(
  db: Pick<typeof prisma, "preparationStep">,
): Promise<PreparationStepDefinition[]> {
  const preparationSteps = await db.preparationStep.findMany({
    include: {
      products: {
        select: {
          id: true,
        },
      },
    },
  });

  return preparationSteps
    .filter(
      (step): step is typeof step & { stationId: string } =>
        typeof step.stationId === "string" && step.stationId.length > 0,
    )
    .map((step) => ({
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
    }));
}

function buildPreparationTaskStations(
  order: {
    createdAt: string;
    id: string;
    orderProducts: Array<{
      comments?: string;
      productId: string;
      quantity: number;
      selectedModifierGroupItemIds: string[];
    }>;
  },
  preparationSteps: PreparationStepDefinition[],
): PreparationTaskStation[] {
  const orderCreatedAt = new Date(order.createdAt);
  const baseCreatedAt = Number.isNaN(orderCreatedAt.getTime())
    ? new Date()
    : orderCreatedAt;
  const stationGoalMinutesMap = new Map<string, number>();

  for (const step of preparationSteps) {
    const goalMinutes =
      typeof step.goalMinutes === "number" && step.goalMinutes > 0
        ? Math.floor(step.goalMinutes)
        : 0;
    const currentGoal = stationGoalMinutesMap.get(step.stationId) ?? 0;
    if (goalMinutes > currentGoal) {
      stationGoalMinutesMap.set(step.stationId, goalMinutes);
    } else if (!stationGoalMinutesMap.has(step.stationId)) {
      stationGoalMinutesMap.set(step.stationId, currentGoal);
    }
  }

  const categoriesMap = new Map<string, PreparationTaskStation>();

  for (const orderProduct of order.orderProducts) {
    const productSteps = preparationSteps.filter((step) =>
      step.productIds.includes(orderProduct.productId),
    );

    for (const step of productSteps) {
      let category = categoriesMap.get(step.stationId);

      if (!category) {
        category = {
          id: randomUUID(),
          stationId: step.stationId,
          completed: false,
          orderId: order.id,
          steps: [],
          snoozes: [],
        };
        categoriesMap.set(step.stationId, category);
      }

      const comments =
        step.includeComments && orderProduct.comments?.trim()
          ? orderProduct.comments.trim()
          : undefined;

      const selectedModifierIds = orderProduct.selectedModifierGroupItemIds ?? [];
      const resolvedModifiers =
        step.includeModifiers && selectedModifierIds.length > 0
          ? selectedModifierIds.map(
              (item): PreparationTrackModifier => ({
                id: randomUUID(),
                completed: false,
                modifierGroupItem: item,
              }),
            )
          : undefined;

      const hasComments = !!comments;
      const hasModifiers = !!resolvedModifiers?.length;
      const canGroup = !hasComments && !hasModifiers;

      const existingTrack = canGroup
        ? category.steps.find(
            (track) =>
              track.preparationStepId === step.id &&
              !track.comments &&
              (!track.preparationStepModifiers ||
                track.preparationStepModifiers.length === 0),
          )
        : undefined;

      if (existingTrack) {
        existingTrack.quantity += orderProduct.quantity;
        continue;
      }

      const stationGoalMinutes = stationGoalMinutesMap.get(step.stationId) ?? 0;

      category.steps.push({
        id: randomUUID(),
        name: step.name,
        quantity: orderProduct.quantity,
        completed: false,
        goalMinutes: stationGoalMinutes,
        expectedAt:
          stationGoalMinutes > 0
            ? new Date(
                baseCreatedAt.getTime() + stationGoalMinutes * 60_000,
              ).toISOString()
            : undefined,
        comments,
        completedComments: false,
        preparationStepModifiers: resolvedModifiers,
        preparationStepId: step.id,
        preparationStepCategoryId: category.id,
      });
    }
  }

  return Array.from(categoriesMap.values())
    .filter((category) => category.steps.length > 0)
    .map((category) => ({
      ...category,
      completed: category.steps.every((step) => step.completed),
    }));
}

function buildReadableOrderNumber(): string {
  return `${Math.floor(Math.random() * 900) + 100}`;
}
