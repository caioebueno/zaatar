import prisma from "../prisma";
import { DEFAULT_PROGRESSIVE_DISCOUNT_ID } from "@/src/constants/progressiveDiscount";
import {
  mapProgressiveDiscountPrize,
  progressiveDiscountPrizeInclude,
} from "@/src/progressiveDiscountPrizeHelpers";
import TProgressiveDiscount from "./types/progressiveDiscount";

const getProgressiveDiscount =
  async (): Promise<TProgressiveDiscount | null> => {
    const prismaProgressiveDiscount =
      await prisma.progressiveDiscount.findUnique({
        where: {
          id: DEFAULT_PROGRESSIVE_DISCOUNT_ID,
        },
        include: {
          steps: {
            orderBy: {
              amount: "asc",
            },
            include: {
              prizes: {
                orderBy: {
                  createdAt: "asc",
                },
                include: progressiveDiscountPrizeInclude,
              },
            },
          },
        },
      });
    if (!prismaProgressiveDiscount) return null;
    return {
      id: prismaProgressiveDiscount?.id,
      steps: prismaProgressiveDiscount?.steps.map((step) => ({
        id: step.id,
        type: step.discountType,
        amount: step.amount || undefined,
        discount: step.discount || undefined,
        prizes: step.prizes.map(mapProgressiveDiscountPrize),
      })),
    };
  };

export default getProgressiveDiscount;
