"use server";

import prisma from "../prisma";
import { Prisma } from "@/src/generated/prisma";
import TCategory from "./types/category";
import TProgressiveDiscount from "./types/progressiveDiscount";

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
          items: true,
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
        id: "bdbe5049-241f-4d93-8b88-ddeef5f34880",
      },
      select: {
        id: true,
        steps: true,
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
          items: item.items.map((modifierItem) => ({
            id: modifierItem.id,
            name: modifierItem.name,
            price: modifierItem.price,
          })),
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
