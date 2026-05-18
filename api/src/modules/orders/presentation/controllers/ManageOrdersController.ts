import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

type PaymentMethod = "CARD" | "CASH" | "ZELLE";
type PaymentProvider = "STRIPE";
type OrderType = "DELIVERY" | "TAKEAWAY";

type ParsedOrderProductUpdate = {
  kind: "update";
  id: string;
  quantity?: number;
  comments?: string | null;
  selectedModifierGroupItemIds?: string[];
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
      const tipAmount = parseOptionalInt(body.tipAmount, "tipAmount");
      const branchId = await resolveBranchId({
        explicitBranchId: parseOptionalNullableId(body.branchId, "branchId"),
        businessId: request.auth?.businessId ?? null,
      });

      if (orderType === "DELIVERY" && !deliveryAddressId) {
        throw invalidField("addressId");
      }

      if (customerId !== null && customerId !== undefined) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { id: true },
        });
        if (!customer) {
          throw invalidField("customerId");
        }
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

      const productIds = Array.from(new Set(cart.items.map((item) => item.productId)));
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

          return sum + extraPrice * selection.quantity;
        }, 0);

        const baseAmount = product.price ?? 0;
        const baseFullAmount = product.comparedAtPrice ?? product.price ?? 0;
        const amount = baseAmount + modifiersAmount + comboSelectionAmount;
        const fullAmount = baseFullAmount + modifiersAmount + comboSelectionAmount;
        orderAmount += amount * item.quantity;

        createdOrderProducts.push({
          id: randomUUID(),
          productId: item.productId,
          quantity: item.quantity,
          comments: item.description ?? null,
          amount,
          fullAmount,
          modifierGroupItemIds,
        });
      }

      const orderId = randomUUID();
      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            id: orderId,
            amount: orderAmount,
            type: orderType,
            paymentMethod,
            paymentProvider: paymentProvider ?? null,
            language: language ?? null,
            customerId: customerId ?? null,
            deliveryAddressId:
              orderType === "DELIVERY" ? deliveryAddressId ?? null : null,
            tipAmount: tipAmount ?? null,
            scheduleFor: scheduleFor ?? null,
          },
        });

        if (branchId !== undefined) {
          await tx.$executeRaw`
            UPDATE "Order"
            SET "branchId" = ${branchId}
            WHERE "id" = ${orderId}
          `;
        }

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
      });

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
          type: true,
          deliveryAddressId: true,
        },
      });

      if (!existingOrder) {
        return { statusCode: 404, body: { error: "Order not found" } };
      }

      const orderProductChanges = parseOrderProductUpdates(body.orderProducts) || [];
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
            await removeDispatchIfEmpty(tx, orderDispatch.dispatchId);
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

        if (parsedPaymentProvider !== undefined) {
          await tx.$executeRaw`
            UPDATE "Order"
            SET "paymentProvider" = ${parsedPaymentProvider}::"PaymentProvider"
            WHERE "id" = ${orderId}
          `;
        }

        await applyOrderProductChanges(tx, orderId, orderProductChanges);
      });

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

    if (hasId) {
      const id = parseRequiredString(row.id, "orderProducts.id");
      if (remove === true) {
        return { kind: "delete", id };
      }

      if (
        quantity === undefined &&
        comments === undefined &&
        selectedModifierGroupItemIds === undefined
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

async function applyOrderProductChanges(
  tx: Prisma.TransactionClient,
  orderId: string,
  changes: ParsedOrderProductChange[],
): Promise<void> {
  if (changes.length === 0) return;

  const deleteIds = changes
    .filter((item): item is ParsedOrderProductDelete => item.kind === "delete")
    .map((item) => item.id);
  const updateIds = changes
    .filter((item): item is ParsedOrderProductUpdate => item.kind === "update")
    .map((item) => item.id);
  const touchIds = Array.from(new Set([...deleteIds, ...updateIds]));

  if (touchIds.length > 0) {
    const existingRows = await tx.orderProducts.findMany({
      where: { orderId, id: { in: touchIds } },
      select: { id: true },
    });
    if (existingRows.length !== touchIds.length) {
      throw invalidField("orderProducts.id");
    }
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
): Promise<void> {
  const [sourceCountResult] = await tx.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::BIGINT AS "count"
    FROM "Order"
    WHERE "dispatchId" = ${dispatchId}
  `;

  if (Number(sourceCountResult?.count ?? 0) > 0) {
    return;
  }

  await tx.$executeRaw`
    DELETE FROM "Dispatch"
    WHERE "id" = ${dispatchId}
  `;
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
      orderProducts: {
        include: {
          product: true,
          modifierGroupItems: true,
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

  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    scheduleFor: order.scheduleFor ? order.scheduleFor.toISOString() : null,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    orderProducts: order.orderProducts.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      modifierGroupItems: item.modifierGroupItems.map((modifierItem) => ({
        ...modifierItem,
        createdAt: modifierItem.createdAt.toISOString(),
      })),
    })),
  };
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
