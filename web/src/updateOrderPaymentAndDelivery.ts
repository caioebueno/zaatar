"use server";

import { randomUUID } from "crypto";
import prisma from "@/prisma";
import type { TOrder, TOrderType, TPaymentMethod } from "@/src/types/order";
import getOrder from "./getOrder";

type UpdateOrderPaymentAndDeliveryInput = {
  orderId: string;
  paidAt?: unknown;
  paymentMethod?: unknown;
  deliveredAt?: unknown;
  orderType?: unknown;
  customerId?: unknown;
  addressId?: unknown;
  orderProducts?: unknown;
};

const VALID_PAYMENT_METHODS: TPaymentMethod[] = ["CARD", "CASH", "ZELLE"];
const VALID_ORDER_TYPES: TOrderType[] = ["DELIVERY", "TAKEAWAY"];

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

function ensureValidTimestamp(
  value: unknown,
  field: "paidAt" | "deliveredAt",
) {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      details: { field },
    };
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw {
      code: "INVALID_PARAMS",
      details: { field },
    };
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw {
      code: "INVALID_PARAMS",
      details: { field },
    };
  }

  return parsedDate;
}

function ensureValidPaymentMethod(paymentMethod: unknown): TPaymentMethod {
  if (
    typeof paymentMethod !== "string" ||
    !VALID_PAYMENT_METHODS.includes(paymentMethod as TPaymentMethod)
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "paymentMethod" },
    };
  }

  return paymentMethod as TPaymentMethod;
}

function ensureValidOrderType(orderType: unknown): TOrderType {
  if (
    typeof orderType !== "string" ||
    !VALID_ORDER_TYPES.includes(orderType as TOrderType)
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "orderType" },
    };
  }

  return orderType as TOrderType;
}

function ensureNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      details: { field },
    };
  }

  const normalized = value.trim();
  if (!normalized) {
    throw {
      code: "INVALID_PARAMS",
      details: { field },
    };
  }

  return normalized;
}

function parseOptionalNullableId(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return ensureNonEmptyString(value, field);
}

function parseOrderProductUpdates(value: unknown): ParsedOrderProductChange[] | undefined {
  if (value === undefined) return undefined;

  if (!Array.isArray(value)) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "orderProducts" },
    };
  }

  return value.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "orderProducts" },
      };
    }

    const record = item as {
      id?: unknown;
      productId?: unknown;
      remove?: unknown;
      quantity?: unknown;
      comments?: unknown;
      selectedModifierGroupItemIds?: unknown;
    };
    const hasId = record.id !== undefined && record.id !== null;
    const hasProductId = record.productId !== undefined && record.productId !== null;

    if (hasId && hasProductId) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "orderProducts" },
      };
    }

    if (!hasId && !hasProductId) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "orderProducts" },
      };
    }
    let remove: boolean | undefined;
    if (record.remove !== undefined) {
      if (typeof record.remove !== "boolean") {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "orderProducts.remove" },
        };
      }
      remove = record.remove;
    }

    let quantity: number | undefined;
    if (record.quantity !== undefined) {
      if (
        typeof record.quantity !== "number" ||
        !Number.isInteger(record.quantity) ||
        record.quantity <= 0
      ) {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "orderProducts.quantity" },
        };
      }
      quantity = record.quantity;
    }

    let comments: string | null | undefined;
    if (record.comments !== undefined) {
      if (record.comments === null) {
        comments = null;
      } else if (typeof record.comments === "string") {
        const normalized = record.comments.trim();
        comments = normalized.length > 0 ? normalized : null;
      } else {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "orderProducts.comments" },
        };
      }
    }

    let selectedModifierGroupItemIds: string[] | undefined;
    if (record.selectedModifierGroupItemIds !== undefined) {
      if (!Array.isArray(record.selectedModifierGroupItemIds)) {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "orderProducts.selectedModifierGroupItemIds" },
        };
      }

      selectedModifierGroupItemIds = Array.from(
        new Set(
          record.selectedModifierGroupItemIds.map((modifierId) =>
            ensureNonEmptyString(
              modifierId,
              "orderProducts.selectedModifierGroupItemIds",
            ),
          ),
        ),
      );
    }

    if (hasId) {
      const id = ensureNonEmptyString(record.id, "orderProducts.id");
      if (remove === true) {
        if (
          quantity !== undefined ||
          comments !== undefined ||
          selectedModifierGroupItemIds !== undefined
        ) {
          throw {
            code: "INVALID_PARAMS",
            details: { field: "orderProducts" },
          };
        }

        return {
          kind: "delete",
          id,
        };
      }

      const update: ParsedOrderProductUpdate = {
        kind: "update",
        id,
      };

      if (quantity !== undefined) {
        update.quantity = quantity;
      }
      if (comments !== undefined) {
        update.comments = comments;
      }
      if (selectedModifierGroupItemIds !== undefined) {
        update.selectedModifierGroupItemIds = selectedModifierGroupItemIds;
      }

      if (
        update.quantity === undefined &&
        update.comments === undefined &&
        update.selectedModifierGroupItemIds === undefined
      ) {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "orderProducts" },
        };
      }

      return update;
    }

    if (remove === true) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "orderProducts.remove" },
      };
    }

    const productId = ensureNonEmptyString(record.productId, "orderProducts.productId");
    return {
      kind: "create",
      productId,
      quantity: quantity ?? 1,
      comments,
      selectedModifierGroupItemIds: selectedModifierGroupItemIds || [],
    };
  });
}

export default async function updateOrderPaymentAndDelivery(
  data: UpdateOrderPaymentAndDeliveryInput,
): Promise<TOrder> {
  const orderId = data.orderId.trim();

  if (!orderId) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "orderId" },
    };
  }

  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, type: true, deliveryAddressId: true },
  });

  if (!existingOrder) {
    throw {
      code: "NOT_FOUND",
      details: { service: "ORDER", id: orderId },
    };
  }

  const orderProductChanges = parseOrderProductUpdates(data.orderProducts) || [];
  const orderProductUpdates = orderProductChanges.filter(
    (item): item is ParsedOrderProductUpdate => item.kind === "update",
  );
  const orderProductDeletes = orderProductChanges.filter(
    (item): item is ParsedOrderProductDelete => item.kind === "delete",
  );
  const orderProductCreates = orderProductChanges.filter(
    (item): item is ParsedOrderProductCreate => item.kind === "create",
  );
  const idBasedOrderProductChanges = orderProductChanges.filter(
    (item): item is ParsedOrderProductUpdate | ParsedOrderProductDelete =>
      item.kind === "update" || item.kind === "delete",
  );
  const orderProductIds = Array.from(
    new Set(idBasedOrderProductChanges.map((item) => item.id)),
  );
  if (orderProductIds.length !== idBasedOrderProductChanges.length) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "orderProducts.id" },
    };
  }

  if (orderProductIds.length > 0) {
    const existingOrderProducts = await prisma.orderProducts.findMany({
      where: {
        orderId,
        id: {
          in: orderProductIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingOrderProducts.length !== orderProductIds.length) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "orderProducts.id" },
      };
    }
  }

  const modifierGroupItemIds = Array.from(
    new Set(
      orderProductChanges.flatMap(
        (item) => item.selectedModifierGroupItemIds || [],
      ),
    ),
  );

  const createProductIds = Array.from(
    new Set(orderProductCreates.map((item) => item.productId)),
  );
  const productsById = new Map<
    string,
    {
      id: string;
      price: number | null;
      comparedAtPrice: number | null;
    }
  >();

  if (createProductIds.length > 0) {
    const products = await prisma.product.findMany({
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
    });

    if (products.length !== createProductIds.length) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "orderProducts.productId" },
      };
    }

    for (const product of products) {
      productsById.set(product.id, product);
    }
  }

  const modifierGroupItemPriceById = new Map<string, number>();
  if (modifierGroupItemIds.length > 0) {
    const existingModifierGroupItems = await prisma.modifierGroupItem.findMany({
      where: {
        id: {
          in: modifierGroupItemIds,
        },
      },
      select: {
        id: true,
        price: true,
      },
    });

    if (existingModifierGroupItems.length !== modifierGroupItemIds.length) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "orderProducts.selectedModifierGroupItemIds" },
      };
    }

    for (const item of existingModifierGroupItems) {
      modifierGroupItemPriceById.set(item.id, item.price);
    }
  }

  const updates: {
    paidAt?: Date | null;
    paymentMethod?: TPaymentMethod;
    deliveredAt?: Date | null;
    type?: TOrderType;
    customerId?: string | null;
    deliveryAddressId?: string | null;
  } = {};

  if (data.paidAt !== undefined) {
    const parsedPaidAt = ensureValidTimestamp(data.paidAt, "paidAt");
    updates.paidAt = parsedPaidAt ?? null;
  }

  if (data.paymentMethod !== undefined) {
    updates.paymentMethod = ensureValidPaymentMethod(data.paymentMethod);
  }

  if (data.deliveredAt !== undefined) {
    const parsedDeliveredAt = ensureValidTimestamp(data.deliveredAt, "deliveredAt");
    updates.deliveredAt = parsedDeliveredAt ?? null;
  }

  if (data.orderType !== undefined) {
    updates.type = ensureValidOrderType(data.orderType);
  }

  const parsedCustomerId = parseOptionalNullableId(data.customerId, "customerId");
  if (parsedCustomerId !== undefined) {
    if (parsedCustomerId !== null) {
      const customerExists = await prisma.customer.findUnique({
        where: { id: parsedCustomerId },
        select: { id: true },
      });

      if (!customerExists) {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "customerId" },
        };
      }
    }

    updates.customerId = parsedCustomerId;
  }

  const parsedAddressId = parseOptionalNullableId(data.addressId, "addressId");
  if (parsedAddressId !== undefined) {
    if (parsedAddressId !== null) {
      const addressExists = await prisma.deliveryAddress.findUnique({
        where: { id: parsedAddressId },
        select: { id: true },
      });

      if (!addressExists) {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "addressId" },
        };
      }
    }

    updates.deliveryAddressId = parsedAddressId;
  }

  if (updates.type === "TAKEAWAY" && updates.deliveryAddressId === undefined) {
    updates.deliveryAddressId = null;
  }

  const nextOrderType = updates.type ?? existingOrder.type;
  const nextDeliveryAddressId =
    updates.deliveryAddressId !== undefined
      ? updates.deliveryAddressId
      : existingOrder.deliveryAddressId;

  if (nextOrderType === "DELIVERY" && !nextDeliveryAddressId) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "addressId" },
    };
  }

  const hasOrderUpdates = Object.keys(updates).length > 0;
  const hasOrderProductUpdates = orderProductChanges.length > 0;

  if (!hasOrderUpdates && !hasOrderProductUpdates) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "body" },
    };
  }

  await prisma.$transaction(async (tx) => {
    if (hasOrderUpdates) {
      await tx.order.update({
        where: { id: orderId },
        data: updates,
      });
    }

    for (const orderProductUpdate of orderProductUpdates) {
      const orderProductData: {
        quantity?: number;
        comments?: string | null;
        modifierGroupItems?: {
          set: {
            id: string;
          }[];
        };
      } = {};

      if (orderProductUpdate.quantity !== undefined) {
        orderProductData.quantity = orderProductUpdate.quantity;
      }

      if (orderProductUpdate.comments !== undefined) {
        orderProductData.comments = orderProductUpdate.comments;
      }

      if (orderProductUpdate.selectedModifierGroupItemIds !== undefined) {
        orderProductData.modifierGroupItems = {
          set: orderProductUpdate.selectedModifierGroupItemIds.map((id) => ({ id })),
        };
      }

      await tx.orderProducts.update({
        where: {
          id: orderProductUpdate.id,
        },
        data: orderProductData,
      });
    }

    for (const orderProductDelete of orderProductDeletes) {
      await tx.orderProducts.delete({
        where: {
          id: orderProductDelete.id,
        },
      });
    }

    for (const orderProductCreate of orderProductCreates) {
      const product = productsById.get(orderProductCreate.productId);

      if (!product) {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "orderProducts.productId" },
        };
      }

      const modifiersAmount = orderProductCreate.selectedModifierGroupItemIds.reduce(
        (sum, modifierId) => sum + (modifierGroupItemPriceById.get(modifierId) ?? 0),
        0,
      );
      const baseAmount = product.price ?? 0;
      const baseFullAmount = product.comparedAtPrice ?? product.price ?? 0;

      await tx.orderProducts.create({
        data: {
          id: randomUUID(),
          orderId,
          productId: orderProductCreate.productId,
          quantity: orderProductCreate.quantity,
          comments: orderProductCreate.comments ?? null,
          amount: baseAmount + modifiersAmount,
          fullAmount: baseFullAmount + modifiersAmount,
          ...(orderProductCreate.selectedModifierGroupItemIds.length > 0
            ? {
                modifierGroupItems: {
                  connect: orderProductCreate.selectedModifierGroupItemIds.map((id) => ({
                    id,
                  })),
                },
              }
            : {}),
        },
      });
    }
  });

  return getOrder(orderId);
}
