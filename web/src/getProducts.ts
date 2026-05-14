"use server";

import prisma from "../prisma";
import { Prisma } from "@/src/generated/prisma";
import TCategory from "./types/category";
import TProduct from "./types/product";
import TProgressiveDiscount from "./types/progressiveDiscount";
import getProgressiveDiscount from "./getProgressiveDiscount";
import { DEFAULT_MENU_ID, DEFAULT_MENU_NAME } from "./constants/menu";
import {
  ensureComboProductItemTable,
  getComboProductsByComboIds,
} from "./comboProductsStore";
import type { TOrderLinkSettings } from "./getOrderLinkSettings";

export type TGetProductsResponse = {
  orderLinkSettings?: TOrderLinkSettings;
  categories: TCategory[];
  progressiveDiscount: TProgressiveDiscount | null;
  activePromotionId?: string | null;
  promotionProductIds?: string[];
  activePromotion?: {
    id: string;
    name: string;
    expireAt: string | null;
    validWeekdays: string[];
    products: TProduct[];
  } | null;
};

type CategoryRow = {
  id: string;
  name: string;
  menuIndex: number | null;
  translations: Prisma.JsonValue | null;
};

type ProductCategoryRow = {
  productId: string;
  categoryId: string;
  categoryIndex: number | null;
  createdAt: Date;
};

type ModifierGroupTranslationsRow = {
  id: string;
  translations: Prisma.JsonValue | null;
};

type ProductVisibleRow = {
  id: string;
  visible: boolean;
};

type ExclusivePromotionProductRow = {
  productId: string;
};

type RequestedPromotionRow = {
  id: string;
  name: string;
  active: boolean;
  expireAt: Date | null;
  validWeekdays: string[];
  products: {
    productId: string;
  }[];
};

const PROMOTION_TIMEZONE =
  process.env.EXCLUSIVE_PROMOTION_TIMEZONE?.trim() || "America/New_York";

function getCurrentPromotionWeekday(): string {
  const weekdayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: PROMOTION_TIMEZONE,
  })
    .format(new Date())
    .toUpperCase();

  switch (weekdayLabel) {
    case "MONDAY":
    case "TUESDAY":
    case "WEDNESDAY":
    case "THURSDAY":
    case "FRIDAY":
    case "SATURDAY":
    case "SUNDAY":
      return weekdayLabel;
    default:
      return "MONDAY";
  }
}

async function ensureDefaultMenuRecord(): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "Menu" ("id", "createdAt", "updatedAt", "name", "active", "isDefault")
    VALUES (${DEFAULT_MENU_ID}, NOW(), NOW(), ${DEFAULT_MENU_NAME}, true, true)
    ON CONFLICT ("id") DO NOTHING
  `;
}

async function resolveMenuIds(requestedMenuId: string | null): Promise<{
  selectedMenuId: string;
  defaultMenuId: string;
}> {
  const defaultMenu = await prisma.menu.findFirst({
    where: {
      active: true,
    },
    select: {
      id: true,
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const defaultMenuId = defaultMenu?.id ?? DEFAULT_MENU_ID;

  if (!requestedMenuId) {
    return {
      selectedMenuId: defaultMenuId,
      defaultMenuId,
    };
  }

  const requestedMenu = await prisma.menu.findUnique({
    where: {
      id: requestedMenuId,
    },
    select: {
      id: true,
    },
  });

  return {
    selectedMenuId: requestedMenu?.id ?? defaultMenuId,
    defaultMenuId,
  };
}

export const getProductsFresh = async (
  menuId?: string | null,
  promotionId?: string | null,
): Promise<TGetProductsResponse> => {
  const normalizedRequestedMenuId =
    typeof menuId === "string" && menuId.trim().length > 0
      ? menuId.trim()
      : null;
  const requestedPromotionId =
    typeof promotionId === "string" && promotionId.trim().length > 0
      ? promotionId.trim()
      : null;

  console.log("[getProductsFresh] request", {
    menuId: normalizedRequestedMenuId,
    promotionId: requestedPromotionId,
  });

  await ensureComboProductItemTable(prisma);
  await ensureDefaultMenuRecord();
  const { selectedMenuId, defaultMenuId } = await resolveMenuIds(
    normalizedRequestedMenuId,
  );

  console.log("[getProductsFresh] menu resolved", {
    selectedMenuId,
    defaultMenuId,
  });

  const categoriesForRequestedMenu = await prisma.$queryRaw<CategoryRow[]>`
    SELECT c."id", c."name", mc."menuIndex", c."translations"
    FROM "MenuCategory" mc
    INNER JOIN "Category" c ON c."id" = mc."categoryId"
    WHERE mc."menuId" = ${selectedMenuId}
    ORDER BY
      COALESCE(mc."menuIndex", 2147483647) ASC,
      mc."createdAt" ASC
  `;

  const prismaCategories =
    categoriesForRequestedMenu.length > 0 || selectedMenuId === defaultMenuId
      ? categoriesForRequestedMenu
      : await prisma.$queryRaw<CategoryRow[]>`
          SELECT c."id", c."name", mc."menuIndex", c."translations"
          FROM "MenuCategory" mc
          INNER JOIN "Category" c ON c."id" = mc."categoryId"
          WHERE mc."menuId" = ${defaultMenuId}
          ORDER BY
            COALESCE(mc."menuIndex", 2147483647) ASC,
            mc."createdAt" ASC
        `;

  const categoryIds = prismaCategories.map((category) => category.id);
  const productCategoryRows: ProductCategoryRow[] =
    categoryIds.length === 0
      ? []
      : await prisma.$queryRaw<ProductCategoryRow[]>`
          SELECT
            "productId",
            "categoryId",
            "categoryIndex",
            "createdAt"
          FROM "ProductCategory"
          WHERE "categoryId" IN (${Prisma.join(categoryIds)})
          ORDER BY
            "categoryId" ASC,
            COALESCE("categoryIndex", 2147483647) ASC,
            "createdAt" ASC
        `;

  const productIds = Array.from(
    new Set(productCategoryRows.map((row) => row.productId)),
  );
  const productInclude = {
    photos: true,
    comboSlots: {
      include: {
        options: {
          include: {
            product: {
              select: {
                name: true,
                translations: true,
                photos: {
                  select: {
                    id: true,
                    url: true,
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: [
            {
              sortIndex: "asc" as const,
            },
            {
              createdAt: "asc" as const,
            },
          ],
        },
      },
      orderBy: [{ sortIndex: "asc" as const }, { createdAt: "asc" as const }],
    },
    modifierGroups: {
      include: {
        items: {
          include: {
            photo: true,
          },
        },
      },
    },
  } satisfies Prisma.ProductInclude;

  const [
    prismaProducts,
    productVisibilityRows,
    modifierGroupTranslationsRows,
    exclusivePromotionProductRows,
    comboProductRows,
    requestedPromotion,
    progressiveDiscount,
  ] = await Promise.all([
    prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: productInclude,
      orderBy: {
        createdAt: "asc",
      },
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
    productIds.length === 0
      ? Promise.resolve([])
      : prisma.$queryRaw<ExclusivePromotionProductRow[]>`
          SELECT
            ep."productId"
          FROM "ExclusivePromotionProduct" ep
          WHERE ep."productId" IN (${Prisma.join(productIds)})
        `,
    getComboProductsByComboIds(prisma, productIds),
    requestedPromotionId
      ? prisma.exclusivePromotion.findUnique({
          where: {
            id: requestedPromotionId,
          },
          select: {
            id: true,
            name: true,
            active: true,
            expireAt: true,
            validWeekdays: true,
            products: {
              select: {
                productId: true,
              },
            },
          },
        })
      : Promise.resolve(null),
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

  const productsById = new Map(prismaProducts.map((product) => [product.id, product]));
  const productCategoryRowsByCategoryId = new Map<string, ProductCategoryRow[]>();
  const comboProductsByComboId = new Map<
    string,
    {
      productId: string;
      quantity: number;
      productName: string;
      productTranslations: Prisma.JsonValue | null;
    }[]
  >();
  const allExclusivePromotionProductIds = new Set<string>();
  const requestedPromotionProductIds = new Set<string>();
  const currentPromotionWeekday = getCurrentPromotionWeekday();
  const now = new Date();
  const requestedPromotionRecord = requestedPromotion as RequestedPromotionRow | null;
  const normalizedRequestedPromotionWeekdays =
    requestedPromotionRecord?.validWeekdays
      ?.filter((weekday): weekday is string => typeof weekday === "string")
      .map((weekday) => weekday.toUpperCase()) ?? [];
  const isRequestedPromotionWeekdayAllowed =
    normalizedRequestedPromotionWeekdays.length === 0 ||
    normalizedRequestedPromotionWeekdays.includes(currentPromotionWeekday);
  const isRequestedPromotionNotExpired =
    requestedPromotionRecord?.expireAt === null ||
    requestedPromotionRecord?.expireAt === undefined ||
    requestedPromotionRecord.expireAt.getTime() >= now.getTime();
  const isRequestedPromotionValid = Boolean(
    requestedPromotionRecord?.active &&
      isRequestedPromotionWeekdayAllowed &&
      isRequestedPromotionNotExpired,
  );
  const activePromotionId = isRequestedPromotionValid
    ? requestedPromotionRecord?.id ?? null
    : null;

  if (isRequestedPromotionValid && requestedPromotionRecord) {
    for (const promotionProduct of requestedPromotionRecord.products) {
      requestedPromotionProductIds.add(promotionProduct.productId);
    }
  }

  console.log("[getProductsFresh] promotion resolved", {
    requestedPromotionId,
    found: Boolean(requestedPromotionRecord),
    valid: isRequestedPromotionValid,
    activePromotionId,
    promotionProductCount: requestedPromotionProductIds.size,
  });

  for (const row of exclusivePromotionProductRows) {
    allExclusivePromotionProductIds.add(row.productId);
  }

  for (const row of productCategoryRows) {
    const current = productCategoryRowsByCategoryId.get(row.categoryId) ?? [];
    current.push(row);
    productCategoryRowsByCategoryId.set(row.categoryId, current);
  }

  for (const row of comboProductRows) {
    const current = comboProductsByComboId.get(row.comboId) ?? [];
    current.push({
      productId: row.productId,
      quantity: row.quantity,
      productName: row.productName,
      productTranslations: row.productTranslations,
    });
    comboProductsByComboId.set(row.comboId, current);
  }

  type LoadedProduct = (typeof prismaProducts)[number];

  const mapLoadedProduct = (
    product: LoadedProduct,
    categoryIndex?: number | null,
  ): TProduct => {
    const directComboProducts = comboProductsByComboId.get(product.id) ?? [];

    return {
    visible:
      visibleByProductId.get(product.id) ??
      (product as typeof product & { visible?: boolean }).visible ??
      true,
    id: product.id,
    itemType: product.itemType,
    name: product.name,
    translations: product.translations as {
      [key: string]: {
        [key: string]: string;
      };
    },
    description: product.description || undefined,
    price: product.price || undefined,
    categoryIndex: categoryIndex ?? undefined,
    comparedAtPrice: product.comparedAtPrice || undefined,
    modifierGroups: product.modifierGroups.map((item) => {
      const modifierGroupTranslations = modifierGroupTranslationsById.get(item.id);

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
      url: photo.url,
    })),
    comboSlots: product.comboSlots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      translations:
        slot.translations && typeof slot.translations === "object"
          ? (slot.translations as {
              [key: string]: {
                [key: string]: string;
              };
            })
          : undefined,
      minSelect: slot.minSelect,
      maxSelect: slot.maxSelect,
      allowDuplicates: slot.allowDuplicates,
      sortIndex: slot.sortIndex,
      options: slot.options.map((option) => ({
        id: option.id,
        productId: option.productId,
        productName: option.product.name,
        productTranslations:
          option.product.translations &&
          typeof option.product.translations === "object"
            ? (option.product.translations as {
                [key: string]: {
                  [key: string]: string;
                };
              })
            : undefined,
        productPhotoUrl: option.product.photos[0]?.url,
        extraPrice: option.extraPrice,
        sortIndex: option.sortIndex,
      })),
    })),
    products: directComboProducts.map((directProduct) => ({
      productId: directProduct.productId,
      quantity: directProduct.quantity,
      productName: directProduct.productName,
      productTranslations:
        directProduct.productTranslations &&
        typeof directProduct.productTranslations === "object"
          ? (directProduct.productTranslations as {
              [key: string]: {
                [key: string]: string;
              };
            })
          : undefined,
    })),
  };
  };

  const categories = prismaCategories.map((category) => ({
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
    products: (productCategoryRowsByCategoryId.get(category.id) ?? [])
      .filter((productCategoryRow) => {
        const product = productsById.get(productCategoryRow.productId);
        if (!product) return false;

        const resolvedVisible =
          visibleByProductId.get(product.id) ??
          (product as typeof product & { visible?: boolean }).visible;

        if (resolvedVisible === false) {
          return false;
        }

        const isExclusivePromotionProduct = allExclusivePromotionProductIds.has(
          product.id,
        );

        if (!isExclusivePromotionProduct) {
          return true;
        }

        if (!activePromotionId) {
          return false;
        }

        return requestedPromotionProductIds.has(product.id);
      })
      .sort((left, right) => {
        const leftIndex = left.categoryIndex ?? Number.MAX_SAFE_INTEGER;
        const rightIndex = right.categoryIndex ?? Number.MAX_SAFE_INTEGER;

        if (leftIndex !== rightIndex) {
          return leftIndex - rightIndex;
        }

        const leftProduct = productsById.get(left.productId);
        const rightProduct = productsById.get(right.productId);

        if (!leftProduct || !rightProduct) return 0;

        return leftProduct.createdAt.getTime() - rightProduct.createdAt.getTime();
      })
      .map((productCategoryRow) => {
        const product = productsById.get(productCategoryRow.productId);
        if (!product) return null;

        return mapLoadedProduct(product, productCategoryRow.categoryIndex);
      })
      .filter((product): product is NonNullable<typeof product> => Boolean(product)),
  }));

  const mappedCategoryProductsById = new Map<string, TProduct>();
  for (const category of categories) {
    for (const product of category.products) {
      mappedCategoryProductsById.set(product.id, product);
    }
  }

  let activePromotionProducts: TProduct[] = [];

  if (activePromotionId && requestedPromotionProductIds.size > 0) {
    const missingPromotionProductIds = Array.from(requestedPromotionProductIds).filter(
      (productId) => !productsById.has(productId),
    );

    const missingPromotionProducts =
      missingPromotionProductIds.length > 0
        ? await prisma.product.findMany({
            where: {
              id: {
                in: missingPromotionProductIds,
              },
            },
            include: productInclude,
            orderBy: {
              createdAt: "asc",
            },
          })
        : [];

    for (const missingProduct of missingPromotionProducts) {
      productsById.set(missingProduct.id, missingProduct);
    }

    activePromotionProducts = Array.from(requestedPromotionProductIds)
      .map((productId) => {
        const mappedFromCategory = mappedCategoryProductsById.get(productId);
        if (mappedFromCategory) return mappedFromCategory;

        const missingProduct = productsById.get(productId);
        if (!missingProduct) return null;

        const visible =
          visibleByProductId.get(missingProduct.id) ??
          (missingProduct as typeof missingProduct & { visible?: boolean }).visible ??
          true;
        if (!visible) return null;

        return mapLoadedProduct(missingProduct);
      })
      .filter((product): product is TProduct => Boolean(product));
  }

  const totalProducts = categories.reduce(
    (sum, category) => sum + category.products.length,
    0,
  );

  console.log("[getProductsFresh] response summary", {
    categoryCount: categories.length,
    totalProducts,
    activePromotionId,
    activePromotionProductsCount: activePromotionProducts.length,
  });

  const response: TGetProductsResponse = {
    progressiveDiscount,
    activePromotionId,
    promotionProductIds: Array.from(requestedPromotionProductIds),
    activePromotion:
      activePromotionId && requestedPromotionRecord
        ? {
            id: requestedPromotionRecord.id,
            name: requestedPromotionRecord.name,
            expireAt: requestedPromotionRecord.expireAt
              ? requestedPromotionRecord.expireAt.toISOString()
              : null,
            validWeekdays: requestedPromotionRecord.validWeekdays ?? [],
            products: activePromotionProducts,
          }
        : null,
    categories,
  };

  console.log("[getProductsFresh] response", response);

  return response;
};

const getProducts = async (
  menuId?: string | null,
  promotionId?: string | null,
): Promise<TGetProductsResponse> => getProductsFresh(menuId, promotionId);

export default getProducts;
