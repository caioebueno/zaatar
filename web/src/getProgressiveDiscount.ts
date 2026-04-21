import prisma from "../prisma";
import { Prisma } from "@/src/generated/prisma";
import {
  mapProgressiveDiscountPrize,
  progressiveDiscountPrizeInclude,
} from "@/src/progressiveDiscountPrizeHelpers";
import TProgressiveDiscount from "./types/progressiveDiscount";
import type { TProgressiveDiscountPrize } from "./types/progressiveDiscount";

type PrizeTranslationsRow = {
  id: string;
  translations: Prisma.JsonValue | null;
};

function parsePrizeTranslations(
  value: unknown,
): TProgressiveDiscountPrize["translations"] | undefined {
  if (!value) return undefined;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as TProgressiveDiscountPrize["translations"];
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as TProgressiveDiscountPrize["translations"];
  }

  return undefined;
}

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

    const prizeIds = resolvedProgressiveDiscount.steps.flatMap((step) =>
      step.prizes.map((prize) => prize.id),
    );
    const translationsByPrizeId = prizeIds.length
      ? new Map(
          (
            await prisma.$queryRaw<PrizeTranslationsRow[]>`
              SELECT "id", "translations"
              FROM "ProgressiveDiscountPrize"
              WHERE "id" IN (${Prisma.join(prizeIds)})
            `
          ).map((row) => [row.id, parsePrizeTranslations(row.translations)]),
        )
      : new Map<string, TProgressiveDiscountPrize["translations"] | undefined>();

    return {
      id: resolvedProgressiveDiscount.id,
      steps: resolvedProgressiveDiscount.steps.map((step) => ({
        id: step.id,
        type: step.discountType,
        amount: step.amount || undefined,
        discount: step.discount || undefined,
        prizes: step.prizes.map((prize) => {
          const mappedPrize = mapProgressiveDiscountPrize(prize);

          return {
            ...mappedPrize,
            translations:
              translationsByPrizeId.get(mappedPrize.id) ??
              mappedPrize.translations,
          };
        }),
      })),
    };
  };

export default getProgressiveDiscount;
