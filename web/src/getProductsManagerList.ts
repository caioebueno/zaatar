import prisma from "@/prisma";
import type { Prisma } from "@/src/generated/prisma";
import { DEFAULT_MENU_ID, DEFAULT_MENU_NAME } from "@/src/constants/menu";
import {
  ensureComboProductItemTable,
  getComboProductsByComboIds,
} from "@/src/comboProductsStore";

export type ProductManagerTranslations = Record<string, Record<string, string>>;

export type ProductManagerModifierGroupItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  translations: ProductManagerTranslations | null;
  photoUrl: string | null;
};

export type ProductManagerModifierGroup = {
  id: string;
  title: string;
  required: boolean;
  type: "MULTI" | "SINGLE" | null;
  minSelection: number | null;
  maxSelection: number | null;
  translations: ProductManagerTranslations | null;
  items: ProductManagerModifierGroupItem[];
};

export type ProductManagerProductItemType = "PRODUCT" | "COMBO";

export type ProductManagerComboItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export type ProductManagerFixedComboProduct = {
  productId: string;
  productName: string;
  quantity: number;
};

export type ProductManagerComboSlotOption = {
  productId: string;
  productName: string;
  extraPrice: number;
  sortIndex: number | null;
};

export type ProductManagerComboSlot = {
  id: string;
  name: string;
  translations: ProductManagerTranslations | null;
  minSelect: number;
  maxSelect: number;
  allowDuplicates: boolean;
  sortIndex: number | null;
  options: ProductManagerComboSlotOption[];
};

export type ProductManagerProduct = {
  id: string;
  itemType: ProductManagerProductItemType;
  name: string;
  visible: boolean;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  createdAt: string;
  translations: ProductManagerTranslations | null;
  photoUrls: string[];
  mainPhotoUrl: string | null;
  modifierGroups: ProductManagerModifierGroup[];
  products: ProductManagerFixedComboProduct[];
  comboItems: ProductManagerComboItem[];
  comboSlots: ProductManagerComboSlot[];
};

export type ProductManagerCategory = {
  id: string;
  title: string;
  menuIndex: number | null;
  products: ProductManagerProduct[];
};

export type ProductManagerListResponse = {
  categories: ProductManagerCategory[];
  uncategorized: ProductManagerProduct[];
  lookupModifierGroups: ProductManagerModifierGroup[];
};

type ProductListRow = Prisma.ProductGetPayload<{
  select: {
    id: true;
    itemType: true;
    name: true;
    visible: true;
    price: true;
    comparedAtPrice: true;
    categoryId: true;
    categoryIndex: true;
    createdAt: true;
    description: true;
    translations: true;
    photos: {
      select: {
        url: true;
      };
      orderBy: {
        createdAt: "asc";
      };
    };
    modifierGroups: {
      select: {
        id: true;
        title: true;
        required: true;
        type: true;
        minSelection: true;
        maxSelection: true;
        translations: true;
        items: {
          select: {
            id: true;
            name: true;
            description: true;
            price: true;
            translations: true;
            photo: {
              select: {
                url: true;
              };
            };
          };
          orderBy: {
            createdAt: "asc";
          };
        };
      };
      orderBy: {
        createdAt: "asc";
      };
    };
    comboSlots: {
      select: {
        id: true;
        name: true;
        translations: true;
        minSelect: true;
        maxSelect: true;
        allowDuplicates: true;
        sortIndex: true;
        options: {
          select: {
            productId: true;
            extraPrice: true;
            sortIndex: true;
            product: {
              select: {
                name: true;
              };
            };
          };
          orderBy: [
            {
              sortIndex: "asc";
            },
            {
              createdAt: "asc";
            },
          ];
        };
      };
      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }];
    };
  };
}>;

type ModifierGroupLookupRow = Prisma.ModifierGroupGetPayload<{
  select: {
    id: true;
    title: true;
    required: true;
    type: true;
    minSelection: true;
    maxSelection: true;
    translations: true;
    items: {
      select: {
        id: true;
        name: true;
        description: true;
        price: true;
        translations: true;
        photo: {
          select: {
            url: true;
          };
        };
      };
      orderBy: {
        createdAt: "asc";
      };
    };
  };
}>;

type MenuCategoryRow = {
  categoryId: string;
  categoryName: string;
  menuIndex: number | null;
  createdAt: Date;
};

type ProductCategoryAssignmentRow = {
  productId: string;
  categoryId: string;
  categoryIndex: number | null;
  createdAt: Date;
};

function parseTranslations(
  value: Prisma.JsonValue | null,
): ProductManagerTranslations | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const output: ProductManagerTranslations = {};

  for (const [locale, localeValue] of Object.entries(value)) {
    if (
      !localeValue ||
      typeof localeValue !== "object" ||
      Array.isArray(localeValue)
    ) {
      continue;
    }

    const normalizedLocaleValue: Record<string, string> = {};

    for (const [key, fieldValue] of Object.entries(localeValue)) {
      if (typeof fieldValue !== "string") continue;

      const normalizedFieldValue = fieldValue.trim();
      if (!normalizedFieldValue) continue;

      normalizedLocaleValue[key] = normalizedFieldValue;
    }

    if (Object.keys(normalizedLocaleValue).length > 0) {
      output[locale] = normalizedLocaleValue;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

function mapModifierGroupItem(
  item: ModifierGroupLookupRow["items"][number],
): ProductManagerModifierGroupItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    translations: parseTranslations(item.translations as Prisma.JsonValue | null),
    photoUrl: item.photo?.url ?? null,
  };
}

function mapModifierGroup(
  modifierGroup: ModifierGroupLookupRow,
): ProductManagerModifierGroup {
  return {
    id: modifierGroup.id,
    title: modifierGroup.title,
    required: modifierGroup.required,
    type: modifierGroup.type,
    minSelection: modifierGroup.minSelection,
    maxSelection: modifierGroup.maxSelection,
    translations: parseTranslations(
      modifierGroup.translations as Prisma.JsonValue | null,
    ),
    items: modifierGroup.items.map(mapModifierGroupItem),
  };
}

function sortProducts(left: ProductListRow, right: ProductListRow): number {
  const leftIndex = left.categoryIndex ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = right.categoryIndex ?? Number.MAX_SAFE_INTEGER;

  if (leftIndex !== rightIndex) return leftIndex - rightIndex;
  return left.createdAt.getTime() - right.createdAt.getTime();
}

function mapProduct(
  product: ProductListRow,
  directComboProducts: ProductManagerFixedComboProduct[],
): ProductManagerProduct {
  return {
    id: product.id,
    itemType: product.itemType,
    name: product.name,
    visible: product.visible !== false,
    description: product.description,
    price: product.price,
    comparedAtPrice: product.comparedAtPrice,
    categoryId: product.categoryId,
    categoryIndex: product.categoryIndex,
    createdAt: product.createdAt.toISOString(),
    translations: parseTranslations(product.translations as Prisma.JsonValue | null),
    photoUrls: product.photos.map((photo) => photo.url),
    mainPhotoUrl: product.photos[0]?.url ?? null,
    modifierGroups: product.modifierGroups.map((modifierGroup) =>
      mapModifierGroup(modifierGroup),
    ),
    products: directComboProducts,
    comboSlots: product.comboSlots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      translations: parseTranslations(slot.translations as Prisma.JsonValue | null),
      minSelect: slot.minSelect,
      maxSelect: slot.maxSelect,
      allowDuplicates: slot.allowDuplicates,
      sortIndex: slot.sortIndex,
      options: slot.options.map((option) => ({
        productId: option.productId,
        productName: option.product.name,
        extraPrice: option.extraPrice,
        sortIndex: option.sortIndex,
      })),
    })),
    comboItems: product.comboSlots
      .map((slot) => {
        const firstOption = slot.options[0];
        if (!firstOption) return null;

        return {
          productId: firstOption.productId,
          productName: firstOption.product.name,
          quantity: Math.max(1, slot.maxSelect),
        };
      })
      .filter(
        (item): item is ProductManagerComboItem => item !== null,
      ),
  };
}

function mapProductForCategory(
  product: ProductListRow,
  directComboProducts: ProductManagerFixedComboProduct[],
  categoryId: string | null,
  categoryIndex: number | null,
): ProductManagerProduct {
  const mapped = mapProduct(product, directComboProducts);

  return {
    ...mapped,
    categoryId,
    categoryIndex,
  };
}

async function ensureDefaultMenuRecord(): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "Menu" ("id", "createdAt", "updatedAt", "name", "active", "isDefault")
    VALUES (${DEFAULT_MENU_ID}, NOW(), NOW(), ${DEFAULT_MENU_NAME}, true, true)
    ON CONFLICT ("id") DO NOTHING
  `;
}

export default async function getProductsManagerList(
  menuId: string = DEFAULT_MENU_ID,
): Promise<ProductManagerListResponse> {
  const normalizedMenuId = menuId.trim() || DEFAULT_MENU_ID;

  await ensureComboProductItemTable(prisma);
  await ensureDefaultMenuRecord();

  const [menuCategories, products, productCategories, lookupModifierGroups] =
    await Promise.all([
      prisma.$queryRaw<MenuCategoryRow[]>`
        SELECT
          mc."categoryId",
          c."name" as "categoryName",
          mc."menuIndex",
          mc."createdAt"
        FROM "MenuCategory" mc
        INNER JOIN "Category" c ON c."id" = mc."categoryId"
        WHERE mc."menuId" = ${normalizedMenuId}
        ORDER BY
          COALESCE(mc."menuIndex", 2147483647) ASC,
          mc."createdAt" ASC
      `,
      prisma.product.findMany({
      select: {
        id: true,
        itemType: true,
        name: true,
        visible: true,
        price: true,
        comparedAtPrice: true,
        categoryId: true,
        categoryIndex: true,
        createdAt: true,
        description: true,
        translations: true,
        photos: {
          select: {
            url: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        modifierGroups: {
          select: {
            id: true,
            title: true,
            required: true,
            type: true,
            minSelection: true,
            maxSelection: true,
            translations: true,
            items: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                translations: true,
                photo: {
                  select: {
                    url: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        comboSlots: {
          select: {
            id: true,
            name: true,
            translations: true,
            minSelect: true,
            maxSelect: true,
            allowDuplicates: true,
            sortIndex: true,
            options: {
              select: {
                productId: true,
                extraPrice: true,
                sortIndex: true,
                product: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
            },
          },
          orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [
        {
          createdAt: "asc",
        },
      ],
      }),
      prisma.$queryRaw<ProductCategoryAssignmentRow[]>`
        SELECT
          "productId",
          "categoryId",
          "categoryIndex",
          "createdAt"
        FROM "ProductCategory"
        ORDER BY
          "categoryId" ASC,
          COALESCE("categoryIndex", 2147483647) ASC,
          "createdAt" ASC
      `,
      prisma.modifierGroup.findMany({
      select: {
        id: true,
        title: true,
        required: true,
        type: true,
        minSelection: true,
        maxSelection: true,
        translations: true,
        items: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            translations: true,
            photo: {
              select: {
                url: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      }),
    ]);

  const categories = menuCategories.map((menuCategory) => ({
    id: menuCategory.categoryId,
    name: menuCategory.categoryName,
    menuIndex: menuCategory.menuIndex,
  }));

  const menuCategoryIds = new Set(categories.map((category) => category.id));
  const productById = new Map(products.map((product) => [product.id, product]));
  const directComboProductRows = await getComboProductsByComboIds(
    prisma,
    products.map((product) => product.id),
  );
  const directComboProductsByComboId = new Map<
    string,
    ProductManagerFixedComboProduct[]
  >();
  for (const row of directComboProductRows) {
    const current = directComboProductsByComboId.get(row.comboId) ?? [];
    current.push({
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
    });
    directComboProductsByComboId.set(row.comboId, current);
  }
  const productCategoriesByCategoryId = new Map<
    string,
    ProductCategoryAssignmentRow[]
  >();

  for (const row of productCategories) {
    const current = productCategoriesByCategoryId.get(row.categoryId) ?? [];
    current.push(row);
    productCategoriesByCategoryId.set(row.categoryId, current);
  }

  const categorized = categories.map((category) => ({
    id: category.id,
    title: category.name,
    menuIndex: category.menuIndex,
    products: (productCategoriesByCategoryId.get(category.id) ?? [])
      .map((row) => {
        const product = productById.get(row.productId);
        if (!product) return null;

        return mapProductForCategory(
          product,
          directComboProductsByComboId.get(product.id) ?? [],
          category.id,
          row.categoryIndex,
        );
      })
      .filter((product): product is ProductManagerProduct => Boolean(product)),
  }));

  const categorizedProductIds = new Set(
    productCategories
      .filter((row) => menuCategoryIds.has(row.categoryId))
      .map((row) => row.productId),
  );

  const uncategorized = products
    .filter((product) => !categorizedProductIds.has(product.id))
    .sort(sortProducts)
    .map((product) =>
      mapProductForCategory(
        product,
        directComboProductsByComboId.get(product.id) ?? [],
        null,
        null,
      ),
    );

  return {
    categories: categorized,
    uncategorized,
    lookupModifierGroups: lookupModifierGroups.map(mapModifierGroup),
  };
}
