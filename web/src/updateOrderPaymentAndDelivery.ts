"use server";

import prisma from "@/prisma";
import type { TOrder, TPaymentMethod } from "@/src/types/order";
import getOrder from "./getOrder";

type UpdateOrderPaymentAndDeliveryInput = {
  orderId: string;
  paidAt?: unknown;
  paymentMethod?: unknown;
  deliveredAt?: unknown;
};

const VALID_PAYMENT_METHODS: TPaymentMethod[] = ["CARD", "CASH", "ZELLE"];

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
    select: { id: true },
  });

  if (!existingOrder) {
    throw {
      code: "NOT_FOUND",
      details: { service: "ORDER", id: orderId },
    };
  }

  const updates: {
    paidAt?: Date | null;
    paymentMethod?: TPaymentMethod;
    deliveredAt?: Date | null;
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

  if (Object.keys(updates).length === 0) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "body" },
    };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: updates,
  });

  return getOrder(orderId);
}
