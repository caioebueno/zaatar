"use server";

import prisma from "../prisma";
import { Prisma } from "@/src/generated/prisma";
import TCategory from "./types/category";
import TProgressiveDiscount from "./types/progressiveDiscount";
import getProgressiveDiscount from "./getProgressiveDiscount";

export type TGetProductsResponse = {
  categories: TCategory[];
  progressiveDiscount: TProgressiveDiscount | null;
};

type CategoryRow = {
  id: string;
  name: string;
  menuIndex: number | null;
  translations: Prisma.JsonValue | null;
};

type ModifierGroupTranslationsRow = {
  id: string;
  translations: Prisma.JsonValue | null;
};

type ProductVisibleRow = {
  id: string;
  visible: boolean;
};

export const getProductsFresh = async (): Promise<TGetProductsResponse> => {
  const [
    prismaCategories,
    prismaProducts,
    productVisibilityRows,
    modifierGroupTranslationsRows,
    progressiveDiscount,
  ] = await Promise.all([
    prisma.$queryRaw<CategoryRow[]>`
      SELECT "id", "name", "menuIndex", "translations"
      FROM "Category"
      ORDER BY
        COALESCE("menuIndex", 2147483647) ASC,
        "createdAt" ASC
    `,
    prisma.product.findMany({
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
      orderBy: [
        {
          categoryId: "asc",
        },
        {
          categoryIndex: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    }),
    prisma.$queryRaw<ProductVisibleRow[]>`
      SELECT "id", "visible"
      FROM "Product"
    `,
    prisma.$queryRaw<ModifierGroupTranslationsRow[]>`
      SELECT
        modifierGroup."id",
        to_jsonb(modifierGroup) -> 'translations' AS "translations"
      FROM "ModifierGroup" modifierGroup
    `,
    getProgressiveDiscount(),
  ]);

  const visibleByProductId = new Map(
    productVisibilityRows.map((row) => [row.id, row.visible]),
  );

  const modifierGroupTranslationsById = new Map<
    string,
    {
      [key: string]: {
        [key: string]: string;
      };
    } | undefined
  >(
    modifierGroupTranslationsRows.map((row) => [
      row.id,
      row.translations && typeof row.translations === "object"
        ? (row.translations as {
            [key: string]: {
              [key: string]: string;
            };
          })
        : undefined,
    ]),
  );

  return {
    progressiveDiscount,
    categories: prismaCategories.map((category) => ({
      id: category.id,
      title: category.name,
      menuIndex: category.menuIndex,
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
        .filter((product) => {
          const resolvedVisible =
            visibleByProductId.get(product.id) ??
            (product as typeof product & { visible?: boolean }).visible;

          return (
            product.categoryId === category.id &&
            resolvedVisible !== false
          );
        })
        .sort((left, right) => {
          const leftIndex = left.categoryIndex ?? Number.MAX_SAFE_INTEGER;
          const rightIndex = right.categoryIndex ?? Number.MAX_SAFE_INTEGER;

          if (leftIndex !== rightIndex) {
            return leftIndex - rightIndex;
          }

          return left.createdAt.getTime() - right.createdAt.getTime();
        })
        .map((product) => ({
        visible:
          visibleByProductId.get(product.id) ??
          (product as typeof product & { visible?: boolean }).visible ??
          true,
        id: product.id,
        name: product.name,
        translations: product.translations as {
          [key: string]: {
            [key: string]: string;
          };
        },
        description: product.description || undefined,
        price: product.price || undefined,
        categoryIndex: product.categoryIndex ?? undefined,
        comparedAtPrice: product.comparedAtPrice || undefined,
        modifierGroups: product.modifierGroups.map((item) => {
          const modifierGroupTranslations = modifierGroupTranslationsById.get(
            item.id,
          );

          return {
            ...(modifierGroupTranslations
            ? {
                translations: modifierGroupTranslations as {
                  [key: string]: {
                    [key: string]: string;
                  };
                },
              }
            : {}),
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
          };
        }),
        photos: product.photos?.map((photo) => ({
          id: photo.id,
          // name: photo.name,
          url: photo.url,
        })),
      })),
    })),
  };
};

const getProducts = async (): Promise<TGetProductsResponse> =>
  getProductsFresh();

export default getProducts;
