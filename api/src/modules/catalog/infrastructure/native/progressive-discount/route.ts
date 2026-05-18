import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../../prisma.js";
import { NextResponse } from "../shared/http.js";

type PrizeTranslationsRow = {
  id: string;
  translations: Prisma.JsonValue | null;
};

function parsePrizeTranslations(value: unknown): Record<string, unknown> | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

export async function GET() {
  try {
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
            include: {
              products: {
                orderBy: {
                  createdAt: "asc" as const,
                },
                include: {
                  product: {
                    include: {
                      photos: {
                        orderBy: {
                          createdAt: "asc" as const,
                        },
                        select: {
                          id: true,
                          url: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const activeDiscount = await prisma.progressiveDiscount.findFirst({
      where: { completed: false },
      include: discountInclude,
      orderBy: { createdAt: "desc" },
    });

    const resolvedDiscount =
      activeDiscount ??
      (await prisma.progressiveDiscount.findFirst({
        include: discountInclude,
        orderBy: { createdAt: "desc" },
      }));

    if (!resolvedDiscount) {
      return NextResponse.json(null);
    }

    const prizeIds = resolvedDiscount.steps.flatMap((step) =>
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
      : new Map<string, Record<string, unknown> | undefined>();

    return NextResponse.json({
      id: resolvedDiscount.id,
      steps: resolvedDiscount.steps.map((step) => ({
        id: step.id,
        type: step.discountType,
        amount: step.amount || undefined,
        discount: step.discount || undefined,
        prizes: step.prizes.map((prize) => ({
          id: prize.id,
          createdAt: prize.createdAt.toISOString(),
          name: prize.name,
          translations:
            translationsByPrizeId.get(prize.id) ||
            (typeof prize.translations === "object" &&
            prize.translations &&
            !Array.isArray(prize.translations)
              ? (prize.translations as Record<string, unknown>)
              : undefined),
          quantity: prize.quantity,
          imageUrl: prize.imageUrl,
          progressiveDiscountStepId: prize.progressiveDiscountStepId,
          products: prize.products.map((prizeProduct) => ({
            id: prizeProduct.product.id,
            name: prizeProduct.product.name,
            translations:
              prizeProduct.product.translations &&
              typeof prizeProduct.product.translations === "object" &&
              !Array.isArray(prizeProduct.product.translations)
                ? (prizeProduct.product.translations as Record<string, unknown>)
                : undefined,
            price: prizeProduct.product.price,
            comparedAtPrice: prizeProduct.product.comparedAtPrice,
            photos: prizeProduct.product.photos.map((photo) => ({
              id: photo.id,
              url: photo.url,
            })),
          })),
        })),
      })),
    });
  } catch (error) {
    console.error("GET /progressive-discount error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
