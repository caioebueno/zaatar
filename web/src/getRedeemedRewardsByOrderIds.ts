"use server";

import prisma from "@/prisma";
import type { TOrder, TOrderRedeemedReward } from "@/src/types/order";

export async function getRedeemedRewardsByOrderIds(
  orderIds: string[],
): Promise<Map<string, TOrderRedeemedReward[]>> {
  const normalizedOrderIds = Array.from(
    new Set(
      orderIds
        .map((orderId) => orderId.trim())
        .filter((orderId) => orderId.length > 0),
    ),
  );

  if (normalizedOrderIds.length === 0) {
    return new Map();
  }

  const redeemedRewards = await prisma.customerReward.findMany({
    where: {
      redeemedByOrderId: {
        in: normalizedOrderIds,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const rewardsByOrderId = new Map<string, TOrderRedeemedReward[]>();

  for (const reward of redeemedRewards) {
    if (!reward.redeemedByOrderId) continue;

    const current = rewardsByOrderId.get(reward.redeemedByOrderId) || [];

    current.push({
      id: reward.id,
      customerId: reward.customerId,
      status: reward.status,
      type: reward.type,
      title: reward.title,
      description: reward.description || undefined,
      quantity: reward.quantity,
      value: reward.value,
      couponCode: reward.couponCode,
      issuedAt: reward.issuedAt.toISOString(),
      expiresAt: reward.expiresAt ? reward.expiresAt.toISOString() : null,
      redeemedAt: reward.redeemedAt ? reward.redeemedAt.toISOString() : null,
      productId: reward.productId,
      ...(reward.product
        ? {
            product: {
              id: reward.product.id,
              name: reward.product.name,
              categoryId: reward.product.categoryId || undefined,
              description: reward.product.description || undefined,
              price: reward.product.price,
              comparedAtPrice: reward.product.comparedAtPrice,
              translations:
                reward.product.translations &&
                typeof reward.product.translations === "object"
                  ? (reward.product.translations as {
                      [key: string]: {
                        [key: string]: string;
                      };
                    })
                  : undefined,
            } as TOrder["orderProducts"][number]["product"],
          }
        : {}),
    });

    rewardsByOrderId.set(reward.redeemedByOrderId, current);
  }

  return rewardsByOrderId;
}

