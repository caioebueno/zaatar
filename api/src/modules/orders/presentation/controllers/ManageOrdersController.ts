import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import { enqueueFeedbackWhatsAppJob } from "../../infrastructure/prisma/enqueueFeedbackWhatsAppJob.js";
import { enqueueOrderConfirmationWhatsAppJob } from "../../infrastructure/prisma/enqueueOrderConfirmationWhatsAppJob.js";
import { enqueueDispatchRouteMetricsRefresh } from "../../../dispatch/infrastructure/prisma/enqueueDispatchRouteMetricsRefresh.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

type PaymentMethod = "CARD" | "CASH" | "ZELLE";
type PaymentProvider = "STRIPE";
type OrderType = "DELIVERY" | "TAKEAWAY";
type ProductItemType = "PRODUCT" | "COMBO";

type ParsedOrderProductUpdate = {
  kind: "update";
  id: string;
  quantity?: number;
  comments?: string | null;
  selectedModifierGroupItemIds?: string[];
  comboSelections?: ParsedComboSelection[];
};

type ParsedComboSelection = {
  modifiers: Array<{ modifierId: string; modifierItemId: string }>;
  optionProductId: string;
  quantity: number;
  slotId: string;
};

type ParsedOrderAdjustment = {
  amount: number;
  description: string;
  type: "DISCOUNT" | "EXTRA_CHARGE";
};

type ParsedOrderProductDelete = {
  kind: "delete";
  id: string;
};

type ParsedOrderProductCreate = {
  kind: "create";
  productId: string;
  quantity: number;
  comments?: string | null;
  selectedModifierGroupItemIds: string[];
};

type ParsedOrderProductChange =
  | ParsedOrderProductUpdate
  | ParsedOrderProductDelete
  | ParsedOrderProductCreate;

type AddedOrderProductForPreparation = {
  comments: string | null;
  productId: string;
  quantity: number;
  selectedModifierGroupItemIds: string[];
};

export class ManageOrdersController implements HttpController {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    if (request.method === "POST" && pathname === "/orders") {
      return this.createOrder(request);
    }

    if (request.method === "PATCH" && pathname.startsWith("/orders/")) {
      return this.updateOrder(request, pathname);
    }

    return {
      statusCode: 404,
      body: { error: "Not found" },
    };
  }

  private async createOrder(request: HttpRequest): Promise<HttpResponse> {
    const body = asObject(request.body);
    try {
      const cart = parseCart(body.cart);
      const customerId = parseOptionalNullableId(body.customerId, "customerId");
      const orderType = parseOrderType(body.orderType);
      const paymentMethod = parsePaymentMethod(body.paymentMethod);
      const paymentProvider = parseOptionalPaymentProvider(body.paymentProvider);
      const language = parseOptionalString(body.language, "language");
      const scheduleFor = parseOptionalDate(body.scheduleFor, "scheduleFor");
      const deliveryAddressId = parseOptionalNullableId(body.addressId, "addressId");
      const orderIntentId = parseOptionalNullableId(body.orderIntentId, "orderIntentId");
      const tipAmount = parseOptionalInt(body.tipAmount, "tipAmount");
      const adjustments = parseOrderAdjustments(body.adjustments, "adjustments") ?? [];
      const branchId = await resolveBranchId({
        explicitBranchId: parseOptionalNullableId(body.branchId, "branchId"),
        businessId: request.auth?.businessId ?? null,
      });

      if (orderType === "DELIVERY" && !deliveryAddressId) {
        throw invalidField("addressId");
      }

      const customer =
        customerId !== null && customerId !== undefined
          ? await prisma.customer.findUnique({
          where: { id: customerId },
              select: { id: true, phone: true },
            })
          : null;
      if (customerId !== null && customerId !== undefined && !customer) {
        throw invalidField("customerId");
      }

      if (deliveryAddressId !== null && deliveryAddressId !== undefined) {
        const address = await prisma.deliveryAddress.findUnique({
          where: { id: deliveryAddressId },
          select: { id: true },
        });
        if (!address) {
          throw invalidField("addressId");
        }
      }

      const productIds = Array.from(
        new Set(
          cart.items.flatMap((item) => [
            item.productId,
            ...item.comboSelections.map((selection) => selection.optionProductId),
          ]),
        ),
      );
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        include: {
          modifierGroups: {
            include: {
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
      });

      if (products.length !== productIds.length) {
        throw invalidField("cart.items.productId");
      }

      const productById = new Map(products.map((product) => [product.id, product]));
      const createdOrderProducts: Array<{
        amount: number;
        comboProductId: string | null;
        comments: string | null;
        fullAmount: number;
        id: string;
        modifierGroupItemIds: string[];
        productId: string;
        quantity: number;
      }> = [];
      let orderAmount = 0;

      for (const item of cart.items) {
        const product = productById.get(item.productId);
        if (!product) {
          throw invalidField("cart.items.productId");
        }

        const modifierPriceById = new Map<string, number>();
        for (const group of product.modifierGroups) {
          for (const modifierItem of group.items) {
            modifierPriceById.set(modifierItem.id, modifierItem.price);
          }
        }

        const modifierGroupItemIds = item.modifiers.map(
          (modifier) => modifier.modifierItemId,
        );
        const modifiersAmount = modifierGroupItemIds.reduce((sum, modifierItemId) => {
          const price = modifierPriceById.get(modifierItemId);
          if (price === undefined) {
            throw invalidField("cart.items.modifiers");
          }
          return sum + price;
        }, 0);

        const comboExtraPriceByKey = new Map<string, number>();
        for (const slot of product.comboSlots) {
          for (const option of slot.options) {
            comboExtraPriceByKey.set(`${slot.id}:${option.productId}`, option.extraPrice);
          }
        }

        const comboSelectionAmount = item.comboSelections.reduce((sum, selection) => {
          const key = `${selection.slotId}:${selection.optionProductId}`;
          const extraPrice = comboExtraPriceByKey.get(key);
          if (extraPrice === undefined) {
            throw invalidField("cart.items.comboSelections");
          }

          const selectedProduct = productById.get(selection.optionProductId);
          if (!selectedProduct) {
            throw invalidField("cart.items.comboSelections.optionProductId");
          }
          const selectedModifierPriceById = new Map<string, number>();
          for (const group of selectedProduct.modifierGroups) {
            for (const modifierItem of group.items) {
              selectedModifierPriceById.set(modifierItem.id, modifierItem.price);
            }
          }
          const selectedModifiersAmount = selection.modifiers.reduce(
            (modifierSum, modifier) => {
              const modifierPrice = selectedModifierPriceById.get(
                modifier.modifierItemId,
              );
              if (modifierPrice === undefined) {
                throw invalidField("cart.items.comboSelections.modifiers");
              }
              return modifierSum + modifierPrice;
            },
            0,
          );

          return sum + (extraPrice + selectedModifiersAmount) * selection.quantity;
        }, 0);

        const baseAmount = product.price ?? 0;
        const baseFullAmount = product.comparedAtPrice ?? product.price ?? 0;
        const amount = baseAmount + modifiersAmount + comboSelectionAmount;
        const fullAmount = baseFullAmount + modifiersAmount + comboSelectionAmount;
        orderAmount += amount * item.quantity;

        const comboOrderProductId = randomUUID();
        createdOrderProducts.push({
          id: comboOrderProductId,
          productId: item.productId,
          quantity: item.quantity,
          comments: item.description ?? null,
          amount,
          fullAmount,
          comboProductId: null,
          modifierGroupItemIds,
        });

        for (const selection of item.comboSelections) {
          if (selection.quantity <= 0) continue;
          createdOrderProducts.push({
            id: randomUUID(),
            productId: selection.optionProductId,
            quantity: item.quantity * selection.quantity,
            comments: null,
            amount: 0,
            fullAmount: 0,
            comboProductId: comboOrderProductId,
            modifierGroupItemIds: selection.modifiers.map(
              (modifier) => modifier.modifierItemId,
            ),
          });
        }
      }

      const orderId = randomUUID();
      const orderNumber = buildReadableOrderNumber();
      const preparationStepDefinitions = await getPreparationStepDefinitions(prisma);
      const orderCreateData: Prisma.OrderUncheckedCreateInput = {
        id: orderId,
        number: orderNumber,
        amount: orderAmount,
        type: orderType,
        paymentMethod,
        paymentProvider: paymentProvider ?? null,
        sourcePlatform: "FOODY",
        language: language ?? null,
        customerId: customerId ?? null,
        deliveryAddressId:
          orderType === "DELIVERY" ? deliveryAddressId ?? null : null,
        tipAmount: tipAmount ?? null,
        scheduleFor: scheduleFor ?? null,
      };

      await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: orderCreateData,
        });

        if (adjustments.length > 0) {
          await tx.orderAdjustment.createMany({
            data: adjustments.map((adjustment) => ({
              id: randomUUID(),
              orderId,
              type: adjustment.type,
              amount: adjustment.amount,
              description: adjustment.description,
            })),
          });
        }

        if (branchId !== undefined) {
          await tx.$executeRaw`
            UPDATE "Order"
            SET "branchId" = ${branchId}
            WHERE "id" = ${orderId}
          `;
        }

        await enqueueOrderConfirmationWhatsAppJob(tx, {
          branchId,
          customerPhone: customer?.phone,
          orderId,
        });

        for (const item of createdOrderProducts) {
          await tx.orderProducts.create({
            data: {
              id: item.id,
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              comments: item.comments,
              amount: item.amount,
              fullAmount: item.fullAmount,
              comboProductId: item.comboProductId,
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
            orderId,
            orderCreatedAt: createdOrder.createdAt,
            orderProducts: createdOrderProducts.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              comments: item.comments,
              selectedModifierGroupItemIds: item.modifierGroupItemIds,
            })),
            cartItems: cart.items,
            productById: new Map(
              Array.from(productById.entries()).map(([id, product]) => [
                id,
                {
                  id: product.id,
                  itemType: product.itemType as ProductItemType,
                },
              ]),
            ),
          },
          preparationStepDefinitions,
        );

        if (orderType === "TAKEAWAY") {
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
              id: orderId,
            },
            data: {
              dispatchId,
              dispatchOrderIndex: 1,
            },
          });
        }

        if (orderIntentId) {
          await tx.$executeRaw`
            UPDATE "OrderIntent"
            SET
              "active" = false,
              "updatedAt" = NOW()
            WHERE "id" = ${orderIntentId}
          `;
        }
      }, {
        maxWait: ORDER_CREATION_TRANSACTION_MAX_WAIT_MS,
        timeout: ORDER_CREATION_TRANSACTION_TIMEOUT_MS,
      });

      if (orderType === "DELIVERY" && deliveryAddressId) {
        await ensureDeliveryOrderHasDispatch({
          orderId,
          deliveryAddressId,
          isScheduledOrder: Boolean(scheduleFor),
        });
      }

      const order = await loadOrderWithRelations(orderId);
      return { statusCode: 201, body: order };
    } catch (error) {
      return mapKnownError(error, "POST /orders");
    }
  }

  private async updateOrder(
    request: HttpRequest,
    pathname: string,
  ): Promise<HttpResponse> {
    const orderId = decodeURIComponent(pathname.slice("/orders/".length)).trim();
    const body = asObject(request.body);

    try {
      if (!orderId) {
        throw invalidField("orderId");
      }

      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          createdAt: true,
          deliveredAt: true,
          type: true,
          dispatchId: true,
          deliveryAddressId: true,
        },
      });

      if (!existingOrder) {
        return { statusCode: 404, body: { error: "Order not found" } };
      }

      const orderProductChanges = parseOrderProductUpdates(body.orderProducts) || [];
      const parsedAdjustments = parseOrderAdjustments(body.adjustments, "adjustments");
      const parsedPaidAt = parseOptionalDate(body.paidAt, "paidAt");
      const parsedDeliveredAt = parseOptionalDate(body.deliveredAt, "deliveredAt");
      const parsedPaymentMethod =
        body.paymentMethod === undefined
          ? undefined
          : parsePaymentMethod(body.paymentMethod);
      const parsedPaymentProvider =
        body.paymentProvider === undefined
          ? undefined
          : parseOptionalPaymentProvider(body.paymentProvider);
      const parsedCanceled =
        body.canceled === undefined ? undefined : parseRequiredBoolean(body.canceled, "canceled");
      const parsedOrderType =
        body.orderType !== undefined || body.type !== undefined
          ? parseOrderType(body.orderType ?? body.type)
          : undefined;
      const parsedCustomerId = parseOptionalNullableId(body.customerId, "customerId");
      const parsedAddressId = parseOptionalNullableId(body.addressId, "addressId");

      if (parsedCustomerId !== undefined && parsedCustomerId !== null) {
        const customer = await prisma.customer.findUnique({
          where: { id: parsedCustomerId },
          select: { id: true },
        });
        if (!customer) {
          throw invalidField("customerId");
        }
      }

      if (parsedAddressId !== undefined && parsedAddressId !== null) {
        const address = await prisma.deliveryAddress.findUnique({
          where: { id: parsedAddressId },
          select: { id: true },
        });
        if (!address) {
          throw invalidField("addressId");
        }
      }

      const nextType = parsedOrderType ?? existingOrder.type;
      const nextAddressId =
        parsedAddressId !== undefined ? parsedAddressId : existingOrder.deliveryAddressId;
      if (nextType === "DELIVERY" && !nextAddressId) {
        throw invalidField("addressId");
      }

      if (
        parsedPaidAt === undefined &&
        parsedDeliveredAt === undefined &&
        parsedPaymentMethod === undefined &&
        parsedPaymentProvider === undefined &&
        parsedCanceled === undefined &&
        parsedOrderType === undefined &&
        parsedCustomerId === undefined &&
        parsedAddressId === undefined &&
        parsedAdjustments === undefined &&
        orderProductChanges.length === 0
      ) {
        throw invalidField("body");
      }

      await prisma.$transaction(async (tx) => {
        if (parsedCanceled === true) {
          const [orderDispatch] = await tx.$queryRaw<Array<{ dispatchId: string | null }>>`
            SELECT "dispatchId"
            FROM "Order"
            WHERE "id" = ${orderId}
            LIMIT 1
          `;

          if (orderDispatch?.dispatchId) {
            await tx.$executeRaw`
              UPDATE "Order"
              SET
                "dispatchId" = NULL,
                "dispatchOrderIndex" = NULL
              WHERE "id" = ${orderId}
            `;
            await normalizeDispatchOrderIndexes(tx, orderDispatch.dispatchId);
            const removedDispatch = await removeDispatchIfEmpty(
              tx,
              orderDispatch.dispatchId,
            );
            if (!removedDispatch) {
              await enqueueDispatchRouteMetricsRefresh(orderDispatch.dispatchId, tx);
            }
          }
        }

        const updates: Prisma.OrderUncheckedUpdateInput = {};
        if (parsedPaidAt !== undefined) updates.paidAt = parsedPaidAt;
        if (parsedDeliveredAt !== undefined) updates.deliveredAt = parsedDeliveredAt;
        if (parsedPaymentMethod !== undefined) updates.paymentMethod = parsedPaymentMethod;
        if (parsedCanceled !== undefined) updates.canceled = parsedCanceled;
        if (parsedOrderType !== undefined) updates.type = parsedOrderType;
        if (parsedCustomerId !== undefined) updates.customerId = parsedCustomerId;
        if (parsedAddressId !== undefined) {
          updates.deliveryAddressId =
            parsedOrderType === "TAKEAWAY" ? null : parsedAddressId;
        } else if (parsedOrderType === "TAKEAWAY") {
          updates.deliveryAddressId = null;
        }

        if (Object.keys(updates).length > 0) {
          await tx.order.update({
            where: { id: orderId },
            data: updates,
          });
        }

        if (
          existingOrder.dispatchId &&
          parsedCanceled !== true &&
          (parsedAddressId !== undefined ||
            parsedDeliveredAt !== undefined ||
            parsedOrderType !== undefined)
        ) {
          await enqueueDispatchRouteMetricsRefresh(existingOrder.dispatchId, tx);
        }

        if (parsedPaymentProvider !== undefined) {
          await tx.$executeRaw`
            UPDATE "Order"
            SET "paymentProvider" = ${parsedPaymentProvider}::"PaymentProvider"
            WHERE "id" = ${orderId}
          `;
        }

        if (parsedAdjustments !== undefined) {
          await tx.orderAdjustment.deleteMany({ where: { orderId } });
          if (parsedAdjustments.length > 0) {
            await tx.orderAdjustment.createMany({
              data: parsedAdjustments.map((adjustment) => ({
                id: randomUUID(),
                orderId,
                type: adjustment.type,
                amount: adjustment.amount,
                description: adjustment.description,
              })),
            });
          }
        }

        await applyOrderProductChanges(
          tx,
          orderId,
          orderProductChanges,
        );

        if (orderProductChanges.length > 0) {
          await rebuildPreparationTasksForOrderTx(tx, {
            orderId,
            orderCreatedAt: existingOrder.createdAt,
          });
        }
      });

      if (
        existingOrder.deliveredAt === null &&
        parsedDeliveredAt instanceof Date
      ) {
        await enqueueFeedbackWhatsAppJob({
          orderId,
          deliveredAt: parsedDeliveredAt,
        });
      }

      const order = await loadOrderWithRelations(orderId);
      return { statusCode: 200, body: order };
    } catch (error) {
      return mapKnownError(error, "PATCH /orders/:orderId");
    }
  }
}

type ParsedCart = {
  items: Array<{
    cartId: string;
    comboSelections: Array<{
      modifiers: Array<{ modifierId: string; modifierItemId: string }>;
      optionProductId: string;
      quantity: number;
      slotId: string;
    }>;
    description?: string;
    modifiers: Array<{ modifierId: string; modifierItemId: string }>;
    productId: string;
    quantity: number;
  }>;
};

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
  stationId?: string | null;
  steps: PreparationTrack[];
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

const ORDER_CREATION_TRANSACTION_MAX_WAIT_MS = 10_000;
const ORDER_CREATION_TRANSACTION_TIMEOUT_MS = 20_000;

function parseCart(value: unknown): ParsedCart {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw invalidField("cart");
  }

  const itemsRaw = (value as { items?: unknown }).items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw invalidField("cart.items");
  }

  const items = itemsRaw.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw invalidField("cart.items");
    }

    const row = item as Record<string, unknown>;
    const cartId = parseRequiredString(row.cartId, "cart.items.cartId");
    const productId = parseRequiredString(row.productId, "cart.items.productId");
    const quantity = parseRequiredInt(row.quantity, "cart.items.quantity");
    const description = parseOptionalString(row.description, "cart.items.description");

    const modifiersRaw = row.modifiers;
    if (!Array.isArray(modifiersRaw)) {
      throw invalidField("cart.items.modifiers");
    }
    const modifiers = modifiersRaw.map((modifier) => {
      if (
        typeof modifier !== "object" ||
        modifier === null ||
        Array.isArray(modifier)
      ) {
        throw invalidField("cart.items.modifiers");
      }
      const parsed = modifier as Record<string, unknown>;
      return {
        modifierId: parseRequiredString(
          parsed.modifierId,
          "cart.items.modifiers.modifierId",
        ),
        modifierItemId: parseRequiredString(
          parsed.modifierItemId,
          "cart.items.modifiers.modifierItemId",
        ),
      };
    });

    const comboSelectionsRaw = row.comboSelections;
    let comboSelections: Array<{
      modifiers: Array<{ modifierId: string; modifierItemId: string }>;
      optionProductId: string;
      quantity: number;
      slotId: string;
    }> = [];
    if (comboSelectionsRaw !== undefined) {
      if (!Array.isArray(comboSelectionsRaw)) {
        throw invalidField("cart.items.comboSelections");
      }
      comboSelections = comboSelectionsRaw.map((selection) => {
        if (
          typeof selection !== "object" ||
          selection === null ||
          Array.isArray(selection)
        ) {
          throw invalidField("cart.items.comboSelections");
        }
        const parsed = selection as Record<string, unknown>;
        const selectionModifiersRaw = parsed.modifiers ?? [];
        if (!Array.isArray(selectionModifiersRaw)) {
          throw invalidField("cart.items.comboSelections.modifiers");
        }
        const modifiers = selectionModifiersRaw.map((modifier) => {
          if (!modifier || typeof modifier !== "object" || Array.isArray(modifier)) {
            throw invalidField("cart.items.comboSelections.modifiers");
          }
          const parsedModifier = modifier as Record<string, unknown>;
          return {
            modifierId: parseRequiredString(
              parsedModifier.modifierId,
              "cart.items.comboSelections.modifiers.modifierId",
            ),
            modifierItemId: parseRequiredString(
              parsedModifier.modifierItemId,
              "cart.items.comboSelections.modifiers.modifierItemId",
            ),
          };
        });
        return {
          slotId: parseRequiredString(
            parsed.slotId,
            "cart.items.comboSelections.slotId",
          ),
          optionProductId: parseRequiredString(
            parsed.optionProductId,
            "cart.items.comboSelections.optionProductId",
          ),
          quantity: parseRequiredInt(
            parsed.quantity,
            "cart.items.comboSelections.quantity",
          ),
          modifiers,
        };
      });
    }

    return {
      cartId,
      productId,
      quantity,
      modifiers,
      comboSelections,
      ...(description ? { description } : {}),
    };
  });

  return { items };
}

function parseOrderProductUpdates(value: unknown): ParsedOrderProductChange[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw invalidField("orderProducts");
  }

  return value.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw invalidField("orderProducts");
    }

    const row = item as Record<string, unknown>;
    const hasId = row.id !== undefined && row.id !== null;
    const hasProductId = row.productId !== undefined && row.productId !== null;
    if (hasId === hasProductId) {
      throw invalidField("orderProducts");
    }

    const remove =
      row.remove === undefined ? undefined : parseRequiredBoolean(row.remove, "orderProducts.remove");
    const quantity =
      row.quantity === undefined
        ? undefined
        : parseRequiredInt(row.quantity, "orderProducts.quantity");
    const comments =
      row.comments === undefined
        ? undefined
        : row.comments === null
          ? null
          : parseOptionalString(row.comments, "orderProducts.comments") ?? null;
    const selectedModifierGroupItemIds =
      row.selectedModifierGroupItemIds === undefined
        ? undefined
        : parseStringArray(
            row.selectedModifierGroupItemIds,
            "orderProducts.selectedModifierGroupItemIds",
          );
    const comboSelections =
      row.comboSelections === undefined
        ? undefined
        : parseOrderProductComboSelections(row.comboSelections);

    if (hasId) {
      const id = parseRequiredString(row.id, "orderProducts.id");
      if (remove === true) {
        return { kind: "delete", id };
      }

      if (
        quantity === undefined &&
        comments === undefined &&
        selectedModifierGroupItemIds === undefined &&
        comboSelections === undefined
      ) {
        throw invalidField("orderProducts");
      }

      return {
        kind: "update",
        id,
        ...(quantity !== undefined ? { quantity } : {}),
        ...(comments !== undefined ? { comments } : {}),
        ...(selectedModifierGroupItemIds !== undefined
          ? { selectedModifierGroupItemIds }
          : {}),
        ...(comboSelections !== undefined ? { comboSelections } : {}),
      };
    }

    if (remove === true) {
      throw invalidField("orderProducts.remove");
    }

    return {
      kind: "create",
      productId: parseRequiredString(row.productId, "orderProducts.productId"),
      quantity: quantity ?? 1,
      comments,
      selectedModifierGroupItemIds: selectedModifierGroupItemIds ?? [],
    };
  });
}

function parseOrderAdjustments(
  value: unknown,
  field: string,
): ParsedOrderAdjustment[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw invalidField(field);

  return value.map((adjustment) => {
    if (!adjustment || typeof adjustment !== "object" || Array.isArray(adjustment)) {
      throw invalidField(field);
    }
    const row = adjustment as Record<string, unknown>;
    const type = parseRequiredString(row.type, `${field}.type`);
    if (type !== "DISCOUNT" && type !== "EXTRA_CHARGE") {
      throw invalidField(`${field}.type`);
    }
    return {
      type,
      amount: parseRequiredInt(row.amount, `${field}.amount`),
      description: parseRequiredString(row.description, `${field}.description`),
    };
  });
}

function parseOrderProductComboSelections(value: unknown): ParsedComboSelection[] {
  if (!Array.isArray(value)) {
    throw invalidField("orderProducts.comboSelections");
  }

  return value.map((selection) => {
    if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
      throw invalidField("orderProducts.comboSelections");
    }

    const row = selection as Record<string, unknown>;
    const modifiersRaw = row.modifiers ?? [];
    if (!Array.isArray(modifiersRaw)) {
      throw invalidField("orderProducts.comboSelections.modifiers");
    }

    return {
      slotId: parseRequiredString(row.slotId, "orderProducts.comboSelections.slotId"),
      optionProductId: parseRequiredString(
        row.optionProductId,
        "orderProducts.comboSelections.optionProductId",
      ),
      quantity: parseRequiredInt(
        row.quantity,
        "orderProducts.comboSelections.quantity",
      ),
      modifiers: modifiersRaw.map((modifier) => {
        if (!modifier || typeof modifier !== "object" || Array.isArray(modifier)) {
          throw invalidField("orderProducts.comboSelections.modifiers");
        }
        const modifierRow = modifier as Record<string, unknown>;
        return {
          modifierId: parseRequiredString(
            modifierRow.modifierId,
            "orderProducts.comboSelections.modifiers.modifierId",
          ),
          modifierItemId: parseRequiredString(
            modifierRow.modifierItemId,
            "orderProducts.comboSelections.modifiers.modifierItemId",
          ),
        };
      }),
    };
  });
}

async function applyOrderProductChanges(
  tx: Prisma.TransactionClient,
  orderId: string,
  changes: ParsedOrderProductChange[],
): Promise<AddedOrderProductForPreparation[]> {
  if (changes.length === 0) return [];

  const deleteIds = changes
    .filter((item): item is ParsedOrderProductDelete => item.kind === "delete")
    .map((item) => item.id);
  const updateIds = changes
    .filter((item): item is ParsedOrderProductUpdate => item.kind === "update")
    .map((item) => item.id);
  const touchIds = Array.from(new Set([...deleteIds, ...updateIds]));
  let existingOrderProductById = new Map<
    string,
    {
      id: string;
      productId: string;
      quantity: number;
      modifierGroupItems: Array<{ id: string; price: number }>;
    }
  >();

  if (touchIds.length > 0) {
    const existingRows = await tx.orderProducts.findMany({
      where: { orderId, id: { in: touchIds } },
      select: {
        id: true,
        productId: true,
        quantity: true,
        modifierGroupItems: {
          select: { id: true, price: true },
        },
      },
    });
    if (existingRows.length !== touchIds.length) {
      throw invalidField("orderProducts.id");
    }

    existingOrderProductById = new Map(existingRows.map((row) => [row.id, row]));
  }

  const createChanges = changes.filter(
    (item): item is ParsedOrderProductCreate => item.kind === "create",
  );
  const createProductIds = Array.from(
    new Set(createChanges.map((item) => item.productId)),
  );
  const createProducts = createProductIds.length
    ? await tx.product.findMany({
        where: {
          id: {
            in: createProductIds,
          },
        },
        select: {
          id: true,
          price: true,
          comparedAtPrice: true,
        },
      })
    : [];

  const productById = new Map(createProducts.map((row) => [row.id, row]));
  if (createProducts.length !== createProductIds.length) {
    throw invalidField("orderProducts.productId");
  }

  const addedOrderProducts: AddedOrderProductForPreparation[] = [];

  const modifierIds = Array.from(
    new Set(
      changes.flatMap((item) =>
        item.kind === "delete" ? [] : item.selectedModifierGroupItemIds ?? [],
      ),
    ),
  );
  const modifierRows = modifierIds.length
    ? await tx.modifierGroupItem.findMany({
        where: {
          id: {
            in: modifierIds,
          },
        },
        select: {
          id: true,
          price: true,
        },
      })
    : [];
  if (modifierRows.length !== modifierIds.length) {
    throw invalidField("orderProducts.selectedModifierGroupItemIds");
  }
  const modifierPriceById = new Map(modifierRows.map((row) => [row.id, row.price]));

  const comboUpdates = changes.filter(
    (item): item is ParsedOrderProductUpdate & { comboSelections: ParsedComboSelection[] } =>
      item.kind === "update" && item.comboSelections !== undefined,
  );
  const comboOptionProductIds = comboUpdates.flatMap((item) =>
    item.comboSelections.map((selection) => selection.optionProductId),
  );
  const comboProductIds = comboUpdates.map((item) => {
    const orderProduct = existingOrderProductById.get(item.id);
    if (!orderProduct) throw invalidField("orderProducts.id");
    return orderProduct.productId;
  });
  const comboDefinitionIds = Array.from(
    new Set([...comboProductIds, ...comboOptionProductIds]),
  );
  const comboProducts = comboDefinitionIds.length
    ? await tx.product.findMany({
        where: { id: { in: comboDefinitionIds } },
        include: {
          modifierGroups: {
            include: {
              items: { select: { id: true, price: true } },
            },
          },
          comboSlots: {
            select: {
              id: true,
              options: { select: { productId: true, extraPrice: true } },
            },
          },
        },
      })
    : [];
  if (comboProducts.length !== comboDefinitionIds.length) {
    throw invalidField("orderProducts.comboSelections.optionProductId");
  }
  const comboProductById = new Map(comboProducts.map((product) => [product.id, product]));

  for (const change of changes) {
    if (change.kind === "delete") {
      await tx.orderProducts.delete({ where: { id: change.id } });
      continue;
    }

    if (change.kind === "update") {
      const data: Prisma.OrderProductsUpdateInput = {};
      if (change.quantity !== undefined) {
        data.quantity = change.quantity;
      }
      if (change.comments !== undefined) {
        data.comments = change.comments;
      }
      if (change.selectedModifierGroupItemIds !== undefined) {
        data.modifierGroupItems = {
          set: change.selectedModifierGroupItemIds.map((id) => ({ id })),
        };
      }

      if (change.comboSelections !== undefined) {
        const existingOrderProduct = existingOrderProductById.get(change.id);
        if (!existingOrderProduct) {
          throw invalidField("orderProducts.id");
        }
        const comboProduct = comboProductById.get(existingOrderProduct.productId);
        if (!comboProduct || comboProduct.comboSlots.length === 0) {
          throw invalidField("orderProducts.comboSelections");
        }

        const nextParentQuantity = change.quantity ?? existingOrderProduct.quantity;
        let selectionsAmount = 0;
        const selectedOrderProducts: Prisma.OrderProductsCreateManyInput[] = [];
        for (const selection of change.comboSelections) {
          const slot = comboProduct.comboSlots.find((item) => item.id === selection.slotId);
          const option = slot?.options.find(
            (item) => item.productId === selection.optionProductId,
          );
          if (!slot || !option) {
            throw invalidField("orderProducts.comboSelections");
          }

          const selectedProduct = comboProductById.get(selection.optionProductId);
          if (!selectedProduct) {
            throw invalidField("orderProducts.comboSelections.optionProductId");
          }
          const selectedModifierPriceById = new Map<string, number>();
          for (const group of selectedProduct.modifierGroups) {
            for (const modifierItem of group.items) {
              selectedModifierPriceById.set(modifierItem.id, modifierItem.price);
            }
          }
          const selectedModifierIds = selection.modifiers.map(
            (modifier) => modifier.modifierItemId,
          );
          const selectedModifiersAmount = selectedModifierIds.reduce((sum, id) => {
            const price = selectedModifierPriceById.get(id);
            if (price === undefined) {
              throw invalidField("orderProducts.comboSelections.modifiers");
            }
            return sum + price;
          }, 0);

          selectionsAmount +=
            (option.extraPrice + selectedModifiersAmount) * selection.quantity;
          selectedOrderProducts.push({
            id: randomUUID(),
            orderId,
            productId: selection.optionProductId,
            quantity: nextParentQuantity * selection.quantity,
            comments: null,
            amount: 0,
            fullAmount: 0,
            comboProductId: change.id,
          });
        }

        const parentModifierIds =
          change.selectedModifierGroupItemIds ??
          existingOrderProduct.modifierGroupItems.map((item) => item.id);
        const existingParentModifierPriceById = new Map(
          existingOrderProduct.modifierGroupItems.map((item) => [item.id, item.price]),
        );
        const parentModifierAmount = parentModifierIds.reduce((sum, id) => {
          const price =
            modifierPriceById.get(id) ?? existingParentModifierPriceById.get(id);
          if (price === undefined) {
            throw invalidField("orderProducts.selectedModifierGroupItemIds");
          }
          return sum + price;
        }, 0);
        data.amount = (comboProduct.price ?? 0) + parentModifierAmount + selectionsAmount;
        data.fullAmount =
          (comboProduct.comparedAtPrice ?? comboProduct.price ?? 0) +
          parentModifierAmount +
          selectionsAmount;

        await tx.orderProducts.deleteMany({ where: { comboProductId: change.id } });
        if (selectedOrderProducts.length > 0) {
          await tx.orderProducts.createMany({ data: selectedOrderProducts });
          for (let index = 0; index < selectedOrderProducts.length; index += 1) {
            const modifierIds = change.comboSelections[index].modifiers.map(
              (modifier) => modifier.modifierItemId,
            );
            if (modifierIds.length > 0) {
              await tx.orderProducts.update({
                where: { id: selectedOrderProducts[index].id },
                data: { modifierGroupItems: { connect: modifierIds.map((id) => ({ id })) } },
              });
            }
          }
        }
      }

      await tx.orderProducts.update({
        where: { id: change.id },
        data,
      });
      continue;
    }

    const baseProduct = productById.get(change.productId);
    if (!baseProduct) {
      throw invalidField("orderProducts.productId");
    }

    const modifiersAmount = change.selectedModifierGroupItemIds.reduce((sum, id) => {
      return sum + (modifierPriceById.get(id) ?? 0);
    }, 0);
    const baseAmount = baseProduct.price ?? 0;
    const baseFullAmount = baseProduct.comparedAtPrice ?? baseProduct.price ?? 0;

    await tx.orderProducts.create({
      data: {
        id: randomUUID(),
        orderId,
        productId: change.productId,
        quantity: change.quantity,
        comments: change.comments ?? null,
        amount: baseAmount + modifiersAmount,
        fullAmount: baseFullAmount + modifiersAmount,
        ...(change.selectedModifierGroupItemIds.length > 0
          ? {
              modifierGroupItems: {
                connect: change.selectedModifierGroupItemIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
    });

    addedOrderProducts.push({
      productId: change.productId,
      quantity: change.quantity,
      comments: change.comments ?? null,
      selectedModifierGroupItemIds: change.selectedModifierGroupItemIds,
    });
  }

  const subtotal = await tx.orderProducts.aggregate({
    where: { orderId },
    _sum: {
      amount: true,
    },
  });

  await tx.order.update({
    where: { id: orderId },
    data: {
      amount: subtotal._sum.amount ?? 0,
    },
  });

  return addedOrderProducts;
}

async function normalizeDispatchOrderIndexes(
  tx: Prisma.TransactionClient,
  dispatchId: string,
): Promise<void> {
  await tx.$executeRaw`
    WITH ranked_orders AS (
      SELECT
        orders."id",
        ROW_NUMBER() OVER (
          ORDER BY
            COALESCE(orders."dispatchOrderIndex", 2147483647) ASC,
            orders."createdAt" ASC,
            orders."id" ASC
        ) AS "nextIndex"
      FROM "Order" orders
      WHERE orders."dispatchId" = ${dispatchId}
    )
    UPDATE "Order" orders
    SET "dispatchOrderIndex" = ranked_orders."nextIndex"
    FROM ranked_orders
    WHERE orders."id" = ranked_orders."id"
  `;
}

async function removeDispatchIfEmpty(
  tx: Prisma.TransactionClient,
  dispatchId: string,
): Promise<boolean> {
  const [sourceCountResult] = await tx.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::BIGINT AS "count"
    FROM "Order"
    WHERE "dispatchId" = ${dispatchId}
  `;

  if (Number(sourceCountResult?.count ?? 0) > 0) {
    return false;
  }

  await tx.$executeRaw`
    DELETE FROM "Dispatch"
    WHERE "id" = ${dispatchId}
  `;

  return true;
}

async function resolveBranchId(input: {
  businessId: string | null;
  explicitBranchId: string | null | undefined;
}): Promise<string | null | undefined> {
  if (input.explicitBranchId !== undefined) {
    return input.explicitBranchId;
  }

  if (!input.businessId) {
    return undefined;
  }

  const branches = await prisma.branch.findMany({
    where: {
      businessId: input.businessId,
    },
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 2,
  });

  if (branches.length === 1) {
    return branches[0].id;
  }

  return undefined;
}

async function loadOrderWithRelations(orderId: string): Promise<unknown> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      deliveryAddress: true,
      adjustments: {
        orderBy: { createdAt: "asc" },
      },
      orderProducts: {
        include: {
          product: true,
          modifierGroupItems: true,
          selectedProducts: {
            include: {
              product: true,
              modifierGroupItems: true,
            },
          },
        },
      },
      dispatch: {
        select: {
          id: true,
          queueIndex: true,
          dispatched: true,
          dispatchAt: true,
          startedDeliveryAt: true,
          driverId: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  const adjustmentTotal = order.adjustments.reduce(
    (sum, adjustment) =>
      sum + (adjustment.type === "EXTRA_CHARGE" ? adjustment.amount : -adjustment.amount),
    0,
  );

  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    scheduleFor: order.scheduleFor ? order.scheduleFor.toISOString() : null,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    payments: [
      {
        amount: Math.max(0, order.amount + adjustmentTotal),
        paidAt: order.paidAt ? order.paidAt.toISOString() : null,
        paymentType: order.paymentMethod,
      },
    ],
    adjustments: order.adjustments.map((adjustment) => ({
      ...adjustment,
      createdAt: adjustment.createdAt.toISOString(),
    })),
    orderProducts: order.orderProducts
      .filter((item) => item.comboProductId === null)
      .map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      modifierGroupItems: item.modifierGroupItems.map((modifierItem) => ({
        ...modifierItem,
        createdAt: modifierItem.createdAt.toISOString(),
      })),
      selectedProducts: item.selectedProducts.map((selectedProduct) => ({
        ...selectedProduct,
        createdAt: selectedProduct.createdAt.toISOString(),
        modifierGroupItems: selectedProduct.modifierGroupItems.map((modifierItem) => ({
          ...modifierItem,
          createdAt: modifierItem.createdAt.toISOString(),
        })),
      })),
      })),
  };
}

async function ensureDeliveryOrderHasDispatch(input: {
  deliveryAddressId: string;
  isScheduledOrder: boolean;
  orderId: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [orderRow] = await tx.$queryRaw<
      Array<{
        dispatchId: string | null;
      }>
    >`
      SELECT "dispatchId"
      FROM "Order"
      WHERE "id" = ${input.orderId}
      LIMIT 1
    `;

    if (orderRow?.dispatchId) {
      return;
    }

    let targetDispatchId: string | null = null;

    if (!input.isScheduledOrder) {
      const [candidateDispatch] = await tx.$queryRaw<
        Array<{
          id: string;
        }>
      >`
        SELECT dispatch."id"
        FROM "Dispatch" dispatch
        INNER JOIN "Order" orders
          ON orders."dispatchId" = dispatch."id"
        WHERE dispatch."dispatched" = false
          AND dispatch."startedDeliveryAt" IS NULL
          AND orders."deliveryAddressId" = ${input.deliveryAddressId}
          AND orders."type" = 'DELIVERY'
          AND orders."canceled" = false
          AND orders."deliveredAt" IS NULL
        GROUP BY dispatch."id", dispatch."queueIndex", dispatch."createdAt"
        HAVING COUNT(orders."id") < 3
        ORDER BY
          COALESCE(dispatch."queueIndex", 2147483647) ASC,
          dispatch."createdAt" ASC
        LIMIT 1
      `;

      targetDispatchId = candidateDispatch?.id ?? null;
    }

    if (!targetDispatchId) {
      targetDispatchId = randomUUID();
      const [nextQueueIndexResult] = await tx.$queryRaw<
        Array<{
          nextQueueIndex: number;
        }>
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
          ${targetDispatchId},
          ${nextQueueIndex},
          false,
          NULL,
          NULL
        )
      `;
    }

    const [targetCountResult] = await tx.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::BIGINT AS "count"
      FROM "Order"
      WHERE "dispatchId" = ${targetDispatchId}
    `;
    const targetOrderCount = Number(targetCountResult?.count ?? 0);

    await tx.$executeRaw`
      UPDATE "Order"
      SET
        "dispatchId" = ${targetDispatchId},
        "dispatchOrderIndex" = ${targetOrderCount + 1}
      WHERE "id" = ${input.orderId}
    `;

    await enqueueDispatchRouteMetricsRefresh(targetDispatchId, tx);
  });
}

async function rebuildPreparationTasksForOrderTx(
  tx: Prisma.TransactionClient,
  input: { orderId: string; orderCreatedAt: Date },
): Promise<void> {
  const orderProducts = await tx.orderProducts.findMany({
    where: { orderId: input.orderId },
    select: {
      id: true,
      productId: true,
      quantity: true,
      comments: true,
      comboProductId: true,
      modifierGroupItems: { select: { id: true } },
    },
  });

  const productIds = Array.from(
    new Set(orderProducts.map((item) => item.productId)),
  );
  const products = productIds.length
    ? await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, itemType: true },
      })
    : [];
  const productById = new Map(
    products.map((product) => [
      product.id,
      { id: product.id, itemType: product.itemType as ProductItemType },
    ]),
  );
  const selectedComboParentIds = new Set(
    orderProducts.flatMap((item) =>
      item.comboProductId ? [item.comboProductId] : [],
    ),
  );

  // Preparation tracks are derived data. Rebuilding from the final persisted
  // order keeps quantities, comments, modifiers, and combo selections aligned.
  await tx.preparationStepCategory.deleteMany({
    where: { orderId: input.orderId },
  });

  if (orderProducts.length === 0) return;

  await createPreparationStepCategoriesForOrderTx(
    tx,
    {
      orderId: input.orderId,
      orderCreatedAt: input.orderCreatedAt,
      cartItems: orderProducts
        .filter((item) => item.comboProductId === null)
        .map((item) => ({
          cartId: randomUUID(),
          productId: item.productId,
          quantity: item.quantity,
          modifiers: [],
          comboSelections: [],
          hasPersistedComboSelections: selectedComboParentIds.has(item.id),
        })),
      orderProducts: orderProducts.map((item) => ({
        comboProductId: item.comboProductId ?? undefined,
        comments: item.comments,
        productId: item.productId,
        quantity: item.quantity,
        selectedModifierGroupItemIds: item.modifierGroupItems.map(
          (modifierItem) => modifierItem.id,
        ),
      })),
      productById,
    },
    await getPreparationStepDefinitions(tx),
  );
}

async function createPreparationStepCategoriesForOrderTx(
  tx: Prisma.TransactionClient,
  input: {
    cartItems: Array<
      ParsedCart["items"][number] & {
        hasPersistedComboSelections?: boolean;
      }
    >;
    orderCreatedAt: Date;
    orderId: string;
    orderProducts: Array<{
      comboProductId?: string;
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
            !cartItem.hasPersistedComboSelections &&
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
      // Selected slot products are already persisted as zero-priced order lines,
      // including their modifiers, and were copied into preparationOrderProducts above.
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

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw invalidField(field);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw invalidField(field);
  }
  return normalized;
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return parseRequiredString(value, field);
}

function parseOptionalNullableId(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return parseRequiredString(value, field);
}

function parseRequiredInt(value: unknown, field: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw invalidField(field);
  }
  return value;
}

function parseOptionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  return parseRequiredInt(value, field);
}

function parseRequiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw invalidField(field);
  }
  return value;
}

function parseOptionalDate(value: unknown, field: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw invalidField(field);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw invalidField(field);
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw invalidField(field);
  }
  return parsed;
}

function parseOrderType(value: unknown): OrderType {
  if (value !== "DELIVERY" && value !== "TAKEAWAY") {
    throw invalidField("orderType");
  }
  return value;
}

function parsePaymentMethod(value: unknown): PaymentMethod {
  if (value !== "CARD" && value !== "CASH" && value !== "ZELLE") {
    throw invalidField("paymentMethod");
  }
  return value;
}

function parseOptionalPaymentProvider(value: unknown): PaymentProvider | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw invalidField("paymentProvider");
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    throw invalidField("paymentProvider");
  }
  if (normalized !== "STRIPE") {
    throw invalidField("paymentProvider");
  }

  return normalized as PaymentProvider;
}

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw invalidField(field);
  }

  return Array.from(new Set(value.map((item) => parseRequiredString(item, field))));
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function invalidField(field: string): { code: string; details: { field: string } } {
  return {
    code: "INVALID_PARAMS",
    details: { field },
  };
}

function mapKnownError(error: unknown, routeLabel: string): HttpResponse {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "INVALID_PARAMS"
  ) {
    const field =
      "details" in error &&
      typeof (error as { details?: { field?: string } }).details?.field === "string"
        ? (error as { details?: { field?: string } }).details?.field
        : undefined;

    return {
      statusCode: 400,
      body: {
        error: "Invalid payload",
        ...(field ? { field } : {}),
      },
    };
  }

  console.error(`${routeLabel} error:`, error);
  return {
    statusCode: 500,
    body: { error: "Internal Server Error" },
  };
}
