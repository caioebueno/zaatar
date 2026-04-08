import { Prisma } from "@/src/generated/prisma";
import type { TProgressiveDiscountPrize } from "@/src/types/progressiveDiscount";

export const progressiveDiscountPrizeInclude = {
  products: {
    orderBy: {
      createdAt: "asc",
    },
    include: {
      product: {
        include: {
          photos: {
            orderBy: {
              createdAt: "asc",
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
} satisfies Prisma.ProgressiveDiscountPrizeInclude;

export type PrismaProgressiveDiscountPrizeWithProducts =
  Prisma.ProgressiveDiscountPrizeGetPayload<{
    include: typeof progressiveDiscountPrizeInclude;
  }>;

export function mapProgressiveDiscountPrize(
  prize: PrismaProgressiveDiscountPrizeWithProducts,
): TProgressiveDiscountPrize {
  return {
    id: prize.id,
    createdAt: prize.createdAt.toISOString(),
    name: prize.name,
    quantity: prize.quantity,
    imageUrl: prize.imageUrl,
    progressiveDiscountStepId: prize.progressiveDiscountStepId,
    products: prize.products.map((prizeProduct) => {
      const product = prizeProduct.product;

      const productTranslations =
        product.translations && typeof product.translations === "object"
          ? (product.translations as {
              [key: string]: {
                [key: string]: string;
              };
            })
          : undefined;

      return {
        id: product.id,
        name: product.name,
        translations: productTranslations,
        price: product.price,
        comparedAtPrice: product.comparedAtPrice,
        photos: product.photos.map((photo) => ({
          id: photo.id,
          url: photo.url,
        })),
      };
    }),
  };
}
