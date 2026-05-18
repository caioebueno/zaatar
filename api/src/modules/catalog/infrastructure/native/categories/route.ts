import prisma from "../../../../../prisma.js";
import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";
import {
  ensureComboProductItemTable,
  getComboProductsByComboIds,
} from "../persistence/comboProductsStore.js";
import { DEFAULT_MENU_ID, DEFAULT_MENU_NAME } from "../constants/menu.js";

import type { HttpResponse } from "../../../../../shared/http/types.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

type PostBody = {
  id?: unknown;
  name?: unknown;
  menuId?: unknown;
  menuIndex?: unknown;
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

function parseString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

function parseOptionalInt(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(field);
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(field);
  }

  return value;
}

function createId(): string {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

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

export async function GET(request: NextRequestLike) {
  try {
    await ensureComboProductItemTable(prisma);
    await ensureDefaultMenuRecord();

    const menuId = request.nextUrl.searchParams.get("menuId");
    const promotionId = request.nextUrl.searchParams.get("promotionId");
    const normalizedRequestedMenuId =
      typeof menuId === "string" && menuId.trim().length > 0
        ? menuId.trim()
        : null;
    const requestedPromotionId =
      typeof promotionId === "string" && promotionId.trim().length > 0
        ? promotionId.trim()
        : null;
    const { selectedMenuId, defaultMenuId } = await resolveMenuIds(
      normalizedRequestedMenuId,
    );

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
                      createdAt: "asc" as const,
                    },
                    take: 1,
                  },
                },
              },
            },
            orderBy: [{ sortIndex: "asc" as const }, { createdAt: "asc" as const }],
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
      exclusivePromotionProductRows,
      comboProductRows,
      requestedPromotion,
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
    ]);

    const visibleByProductId = new Map(
      productVisibilityRows.map((row) => [row.id, row.visible]),
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

    const categories = prismaCategories.map((category) => ({
      id: category.id,
      title: category.name,
      menuIndex: category.menuIndex,
      translations:
        category.translations &&
        typeof category.translations === "object" &&
        !Array.isArray(category.translations)
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

          const directComboProducts = comboProductsByComboId.get(product.id) ?? [];

          return {
            visible:
              visibleByProductId.get(product.id) ??
              (product as typeof product & { visible?: boolean }).visible ??
              true,
            id: product.id,
            itemType: product.itemType,
            name: product.name,
            translations:
              product.translations &&
              typeof product.translations === "object" &&
              !Array.isArray(product.translations)
                ? (product.translations as {
                    [key: string]: {
                      [key: string]: string;
                    };
                  })
                : undefined,
            description: product.description || undefined,
            price: product.price || undefined,
            categoryIndex: productCategoryRow.categoryIndex ?? undefined,
            comparedAtPrice: product.comparedAtPrice || undefined,
            modifierGroups: product.modifierGroups.map((item) => ({
              translations:
                item.translations &&
                typeof item.translations === "object" &&
                !Array.isArray(item.translations)
                  ? (item.translations as {
                      [key: string]: {
                        [key: string]: string;
                      };
                    })
                  : undefined,
              id: item.id,
              required: item.required,
              title: item.title,
              type: item.type,
              minSelection: item.minSelection,
              maxSelection: item.maxSelection,
              items: item.items.map((modifierItem) => ({
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
                  modifierItem.translations &&
                  typeof modifierItem.translations === "object" &&
                  !Array.isArray(modifierItem.translations)
                    ? (modifierItem.translations as {
                        [key: string]: {
                          [key: string]: string;
                        };
                      })
                    : undefined,
              })),
            })),
            photos: product.photos?.map((photo) => ({
              id: photo.id,
              url: photo.url,
            })),
            comboSlots: product.comboSlots.map((slot) => ({
              id: slot.id,
              name: slot.name,
              translations:
                slot.translations &&
                typeof slot.translations === "object" &&
                !Array.isArray(slot.translations)
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
                  typeof option.product.translations === "object" &&
                  !Array.isArray(option.product.translations)
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
                typeof directProduct.productTranslations === "object" &&
                !Array.isArray(directProduct.productTranslations)
                  ? (directProduct.productTranslations as {
                      [key: string]: {
                        [key: string]: string;
                      };
                    })
                  : undefined,
            })),
          };
        })
        .filter((product): product is NonNullable<typeof product> => Boolean(product)),
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequestLike) {
  try {
    const body = (await request.json()) as PostBody;
    const id =
      body.id === undefined ? createId() : parseString(body.id, "id");
    const name = parseString(body.name, "name");
    const menuId = parseString(body.menuId, "menuId");
    const menuIndex = parseOptionalInt(body.menuIndex, "menuIndex");

    const existingMenu = await prisma.menu.findUnique({
      where: {
        id: menuId,
      },
      select: {
        id: true,
      },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Invalid payload", field: "menuId" },
        { status: 400 },
      );
    }

    const createdCategory = await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          id,
          name,
          menuId,
          menuIndex,
        },
        select: {
          id: true,
          name: true,
        },
      });

      await tx.$executeRaw`
        INSERT INTO "MenuCategory" ("menuId", "categoryId", "menuIndex")
        VALUES (${menuId}, ${category.id}, ${menuIndex})
        ON CONFLICT ("menuId", "categoryId")
        DO UPDATE SET "menuIndex" = EXCLUDED."menuIndex"
      `;

      return category;
    });

    return NextResponse.json(
      {
        id: createdCategory.id,
        name: createdCategory.name,
        menuId,
        menuIndex,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Category already exists", field: "id" },
        { status: 409 },
      );
    }

    console.error("POST /api/categories error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
