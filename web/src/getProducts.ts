"use server";

import prisma from "../prisma";
import TCategory from "./types/category";
import TProgressiveDiscount from "./types/progressiveDiscount";

export type TGetProductsResponse = {
  categories: TCategory[];
  progressiveDiscount: TProgressiveDiscount | null;
};

const getProducts = async (): Promise<TGetProductsResponse> => {
  const prismaCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      products: {
        include: {
          photos: true,
          modifierGroups: {
            include: {
              items: true,
            },
          },
        },
      },
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
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
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
