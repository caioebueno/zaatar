import prisma from "@/prisma";
import type { Prisma } from "@/src/generated/prisma";

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

export type ProductManagerProduct = {
  id: string;
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

function mapProduct(product: ProductListRow): ProductManagerProduct {
  return {
    id: product.id,
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
  };
}

export default async function getProductsManagerList(): Promise<ProductManagerListResponse> {
  const [categories, products, lookupModifierGroups] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        menuIndex: true,
      },
      orderBy: [{ menuIndex: "asc" }, { createdAt: "asc" }],
    }),
    prisma.product.findMany({
      select: {
        id: true,
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

  const categorized = categories.map((category) => ({
    id: category.id,
    title: category.name,
    menuIndex: category.menuIndex,
    products: products
      .filter((product) => product.categoryId === category.id)
      .sort(sortProducts)
      .map(mapProduct),
  }));

  const uncategorized = products
    .filter((product) => !product.categoryId)
    .sort(sortProducts)
    .map(mapProduct);

  return {
    categories: categorized,
    uncategorized,
    lookupModifierGroups: lookupModifierGroups.map(mapModifierGroup),
  };
}
