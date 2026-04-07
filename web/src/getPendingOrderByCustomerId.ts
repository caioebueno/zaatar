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
      orders."id",
      orders."number",
      CASE
        WHEN orders."deliveredAt" IS NOT NULL THEN 'DELIVERED'
        WHEN EXISTS (
          SELECT 1
          FROM "Dispatch" dispatch
          WHERE dispatch."id" = orders."dispatchId"
            AND dispatch."dispatched" = true
        ) THEN 'DELIVERING'
        WHEN EXISTS (
          SELECT 1
          FROM "PreparationStepCategory" preparationStepCategory
          INNER JOIN "PreparationStepTrack" preparationStepTrack
            ON preparationStepTrack."preparationStepCategoryId" = preparationStepCategory."id"
          WHERE preparationStepCategory."orderId" = orders."id"
            AND preparationStepTrack."completed" = true
        ) THEN 'PREPARING'
        ELSE 'ACCEPTED'
      END AS "status",
      orders."type"
    FROM "Order" orders
    WHERE orders."customerId" = ${customerId}
      AND orders."deliveredAt" IS NULL
    ORDER BY orders."createdAt" DESC
    LIMIT 1
  `;

  return order ?? null;
};

export default getPendingOrderByCustomerId;
