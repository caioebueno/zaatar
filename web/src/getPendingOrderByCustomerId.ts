"use server";

import prisma from "@/prisma";
import type { TOrderStatus, TOrderType } from "./types/order";

export type TPendingOrder = {
  id: string;
  number: string | null;
  status: TOrderStatus;
  type: TOrderType;
};

const getPendingOrderByCustomerId = async (
  customerId: string,
): Promise<TPendingOrder | null> => {
  const [order] = await prisma.$queryRaw<TPendingOrder[]>`
    SELECT
      "id",
      "number",
      "status",
      "type"
    FROM "Order"
    WHERE "customerId" = ${customerId}
      AND "status" <> 'DELIVERED'
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  return order ?? null;
};

export default getPendingOrderByCustomerId;
