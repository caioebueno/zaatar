import prisma from "../prisma";
import TProgressiveDiscount from "./types/progressiveDiscount";

const getProgressiveDiscount =
  async (): Promise<TProgressiveDiscount | null> => {
    const prismaProgressiveDiscount =
      await prisma.progressiveDiscount.findUnique({
        where: {
          id: "bdbe5049-241f-4d93-8b88-ddeef5f34880",
        },
        select: {
          id: true,
          steps: true,
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
      })),
    };
  };

export default getProgressiveDiscount;
