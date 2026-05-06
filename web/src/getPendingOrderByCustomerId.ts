"use server";

import prisma from "@/prisma";
import type { TOrderRedeemedReward, TOrderStatus, TOrderType } from "./types/order";
import { getRedeemedRewardsByOrderIds } from "@/src/getRedeemedRewardsByOrderIds";

export type TPendingOrder = {
  id: string;
  number: string | null;
  status: TOrderStatus;
  type: TOrderType;
  tip: number | null;
  redeemedRewards?: TOrderRedeemedReward[];
};

const getPendingOrderByCustomerId = async (
  customerId: string,
): Promise<TPendingOrder | null> => {
  const [order] = await prisma.$queryRaw<TPendingOrder[]>`
    SELECT
      orders."id",
      orders."number",
      CASE
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
      orders."type",
      orders."tipAmount" AS "tip"
    FROM "Order" orders
    WHERE orders."customerId" = ${customerId}
      -- Pending order endpoint should only return non-delivered orders.
      AND orders."deliveredAt" IS NULL
    ORDER BY orders."createdAt" DESC
    LIMIT 1
  `;

  if (!order) return null;

  const redeemedRewardsByOrderId = await getRedeemedRewardsByOrderIds([order.id]);

  return {
    ...order,
    redeemedRewards: redeemedRewardsByOrderId.get(order.id) || [],
  };
};

export default getPendingOrderByCustomerId;
