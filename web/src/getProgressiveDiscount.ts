import prisma from "../prisma";
import {
  mapProgressiveDiscountPrize,
  progressiveDiscountPrizeInclude,
} from "@/src/progressiveDiscountPrizeHelpers";
import TProgressiveDiscount from "./types/progressiveDiscount";

const getProgressiveDiscount =
  async (): Promise<TProgressiveDiscount | null> => {
    const discountInclude = {
      steps: {
        orderBy: {
          amount: "asc" as const,
        },
        include: {
          prizes: {
            orderBy: {
              createdAt: "asc" as const,
            },
            include: progressiveDiscountPrizeInclude,
          },
        },
      },
    };
    const prismaProgressiveDiscount =
      await prisma.progressiveDiscount.findFirst({
        where: {
          completed: false,
        },
        include: discountInclude,
        orderBy: {
          createdAt: "desc",
        },
      });
    const fallbackProgressiveDiscount = prismaProgressiveDiscount
      ? null
      : await prisma.progressiveDiscount.findFirst({
          include: discountInclude,
          orderBy: {
            createdAt: "desc",
          },
        });
    const resolvedProgressiveDiscount =
      prismaProgressiveDiscount || fallbackProgressiveDiscount;
    if (!resolvedProgressiveDiscount) return null;
    return {
      id: resolvedProgressiveDiscount.id,
      steps: resolvedProgressiveDiscount.steps.map((step) => ({
        id: step.id,
        type: step.discountType,
        amount: step.amount || undefined,
        discount: step.discount || undefined,
        prizes: step.prizes.map(mapProgressiveDiscountPrize),
      })),
    };
  };

export default getProgressiveDiscount;
