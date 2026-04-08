"use server";

import prisma from "../prisma";
import { Prisma } from "@/src/generated/prisma";
import TCategory from "./types/category";
import TProgressiveDiscount from "./types/progressiveDiscount";
import { DEFAULT_PROGRESSIVE_DISCOUNT_ID } from "@/src/constants/progressiveDiscount";
import {
  mapProgressiveDiscountPrize,
  progressiveDiscountPrizeInclude,
} from "@/src/progressiveDiscountPrizeHelpers";

export type TGetProductsResponse = {
  categories: TCategory[];
  progressiveDiscount: TProgressiveDiscount | null;
};

type CategoryRow = {
  id: string;
  name: string;
  translations: Prisma.JsonValue | null;
};

const getProducts = async (): Promise<TGetProductsResponse> => {
  const prismaCategories = await prisma.$queryRaw<CategoryRow[]>`
    SELECT "id", "name", "translations"
    FROM "Category"
    ORDER BY "createdAt" ASC
  `;
  const prismaProducts = await prisma.product.findMany({
    include: {
      photos: true,
      modifierGroups: {
        include: {
          items: {
            include: {
              photo: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  const prismaProgressiveDiscount = await prisma.progressiveDiscount.findUnique(
    {
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
    },
  );
  return {
    progressiveDiscount: prismaProgressiveDiscount
      ? {
          id: prismaProgressiveDiscount?.id,
          steps: prismaProgressiveDiscount.steps.map((step) => ({
            id: step.id,
            type: step.discountType,
            amount: step.amount || undefined,
            discount: step.discount || undefined,
            prizes: step.prizes.map(mapProgressiveDiscountPrize),
          })),
        }
      : null,
    categories: prismaCategories.map((category) => ({
      id: category.id,
      title: category.name,
      translations:
        category.translations &&
        typeof category.translations === "object"
          ? (category.translations as {
              [key: string]: {
                [key: string]: string;
              };
            })
          : undefined,
      products: prismaProducts
        .filter((product) => product.categoryId === category.id)
        .map((product) => ({
        id: product.id,
        name: product.name,
        translations: product.translations as {
          [key: string]: {
            [key: string]: string;
          };
        },
        description: product.description || undefined,
        price: product.price || undefined,
        comparedAtPrice: product.comparedAtPrice || undefined,
        modifierGroups: product.modifierGroups.map((item) => ({
          id: item.id,
          required: item.required,
          title: item.title,
          type: item.type,
          minSelection: item.minSelection,
          maxSelection: item.maxSelection,
          items: item.items.map((modifierItem) => {
            const modifierItemWithTranslations = modifierItem as typeof modifierItem & {
              translations: unknown;
            };

            return {
              id: modifierItem.id,
              name: modifierItem.name,
              description: modifierItem.description || undefined,
              price: modifierItem.price,
              ...(modifierItem.photo
                ? {
                    photo: {
                      id: modifierItem.photo.id,
                      url: modifierItem.photo.url,
                    },
                  }
                : {}),
              translations:
                modifierItemWithTranslations.translations &&
                typeof modifierItemWithTranslations.translations === "object"
                  ? (modifierItemWithTranslations.translations as {
                      [key: string]: {
                        [key: string]: string;
                      };
                    })
                  : undefined,
            };
          }),
        })),
        photos: product.photos?.map((photo) => ({
          id: photo.id,
          // name: photo.name,
          url: photo.url,
        })),
      })),
    })),
  };
};

export default getProducts;
