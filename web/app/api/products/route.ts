import prisma from "@/prisma";
import {
  ensureComboProductItemTable,
  getComboProductsByComboIds,
  replaceComboProducts,
  type ComboProductInput,
} from "@/src/comboProductsStore";
import { Prisma } from "@/src/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

type ProductVisibleRow = {
  id: string;
  visible: boolean;
};

type ProductCategoryEntry = {
  productId: string;
  categoryId: string;
  categoryIndex: number | null;
};

type DirectComboProductResponse = {
  productId: string;
  productName: string;
  quantity: number;
};

type ProductItemType = "PRODUCT" | "COMBO";

type ComboSlotOptionInput = {
  productId: string;
  extraPrice: number;
  sortIndex: number | null;
};

type LegacyComboItemInput = {
  productId: string;
  quantity: number;
};

type ComboSlotInput = {
  name: string;
  translations: Prisma.InputJsonValue | null;
  minSelect: number;
  maxSelect: number;
  allowDuplicates: boolean;
  sortIndex: number | null;
  options: ComboSlotOptionInput[];
};

type PostBody = {
  id?: unknown;
  name?: unknown;
  visible?: unknown;
  description?: unknown;
  price?: unknown;
  comparedAtPrice?: unknown;
  categoryId?: unknown;
  categoryIds?: unknown;
  categoryIndex?: unknown;
  translations?: unknown;
  photoIds?: unknown;
  photoUrls?: unknown;
  modifierGroupIds?: unknown;
  preparationStepIds?: unknown;
  itemType?: unknown;
  comboSlots?: unknown;
  comboItems?: unknown;
  products?: unknown;
};

type ProductRowResponse = {
  id: string;
  createdAt: string;
  itemType: ProductItemType;
  name: string;
  visible: boolean;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  categoryIds: string[];
  categoryEntries: {
    categoryId: string;
    categoryIndex: number | null;
  }[];
  translations: unknown | null;
  photos: {
    id: string;
    name: string;
    url: string;
  }[];
  photoIds: string[];
  modifierGroupIds: string[];
  modifierGroups: {
    id: string;
    title: string;
    translations?: unknown | null;
    required: boolean;
    type: "MULTI" | "SINGLE" | null;
    minSelection: number | null;
    maxSelection: number | null;
    items: {
      id: string;
      name: string;
      description: string | null;
      price: number;
      translations: unknown | null;
      photo: {
        id: string;
        url: string;
      } | null;
    }[];
  }[];
  preparationStepIds: string[];
  comboSlots: {
    id: string;
    name: string;
    translations: unknown | null;
    minSelect: number;
    maxSelect: number;
    allowDuplicates: boolean;
    sortIndex: number | null;
    options: {
      productId: string;
      productName: string;
      extraPrice: number;
      sortIndex: number | null;
    }[];
  }[];
  comboItems: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  products: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
};

function mapProductRow(product: {
  id: string;
  createdAt: Date;
  itemType: ProductItemType;
  name: string;
  visible?: boolean;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  translations: unknown | null;
  photos: {
    id: string;
    name: string;
    url: string;
  }[];
  modifierGroups: {
    id: string;
    title: string;
    translations?: unknown | null;
    required: boolean;
    type: "MULTI" | "SINGLE" | null;
    minSelection: number | null;
    maxSelection: number | null;
    items: {
      id: string;
      name: string;
      description: string | null;
      price: number;
      translations: unknown | null;
      photo: {
        id: string;
        url: string;
      } | null;
    }[];
  }[];
  preparationSteps: { id: string }[];
  comboSlots: {
    id: string;
    name: string;
    translations: unknown | null;
    minSelect: number;
    maxSelect: number;
    allowDuplicates: boolean;
    sortIndex: number | null;
    options: {
      productId: string;
      extraPrice: number;
      sortIndex: number | null;
      product: {
        name: string;
      };
    }[];
  }[];
}, productCategoryEntries: ProductCategoryEntry[], directComboProducts: DirectComboProductResponse[]): ProductRowResponse {
  return {
    id: product.id,
    createdAt: product.createdAt.toISOString(),
    itemType: product.itemType,
    name: product.name,
    visible: product.visible !== false,
    description: product.description,
    price: product.price,
    comparedAtPrice: product.comparedAtPrice,
    categoryId: product.categoryId,
    categoryIndex: product.categoryIndex,
    categoryIds: productCategoryEntries.map((entry) => entry.categoryId),
    categoryEntries: productCategoryEntries.map((entry) => ({
      categoryId: entry.categoryId,
      categoryIndex: entry.categoryIndex,
    })),
    translations: product.translations,
    photos: product.photos.map((photo) => ({
      id: photo.id,
      name: photo.name,
      url: photo.url,
    })),
    photoIds: product.photos.map((photo) => photo.id),
    modifierGroupIds: product.modifierGroups.map((modifierGroup) => modifierGroup.id),
    modifierGroups: product.modifierGroups.map((modifierGroup) => ({
      id: modifierGroup.id,
      title: modifierGroup.title,
      translations:
        (modifierGroup as typeof modifierGroup & { translations?: unknown | null })
          .translations ?? null,
      required: modifierGroup.required,
      type: modifierGroup.type,
      minSelection: modifierGroup.minSelection,
      maxSelection: modifierGroup.maxSelection,
      items: modifierGroup.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        translations: item.translations,
        photo: item.photo
          ? {
              id: item.photo.id,
              url: item.photo.url,
            }
          : null,
      })),
    })),
    preparationStepIds: product.preparationSteps.map(
      (preparationStep) => preparationStep.id,
    ),
    comboSlots: product.comboSlots.map((comboSlot) => ({
      id: comboSlot.id,
      name: comboSlot.name,
      translations: comboSlot.translations ?? null,
      minSelect: comboSlot.minSelect,
      maxSelect: comboSlot.maxSelect,
      allowDuplicates: comboSlot.allowDuplicates,
      sortIndex: comboSlot.sortIndex,
      options: comboSlot.options.map((option) => ({
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
        (item): item is { productId: string; productName: string; quantity: number } =>
          item !== null,
      ),
    products: directComboProducts,
  };
}

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

function parseNullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseNullableInt(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(field);
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(field);
  }

  return value;
}

function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

function parseProductItemType(value: unknown, field: string): ProductItemType {
  if (value === "PRODUCT" || value === "COMBO") {
    return value;
  }

  throw new Error(field);
}

function parseIdArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(field);
  }

  return Array.from(
    new Set(
      value.map((id) => {
        if (typeof id !== "string") {
          throw new Error(field);
        }

        const normalized = id.trim();
        if (!normalized) {
          throw new Error(field);
        }

        return normalized;
      }),
    ),
  );
}

function parseTranslationsInput(
  value: unknown,
  field: string,
): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(field);
  }

  return value as Prisma.InputJsonValue;
}

function parseComboSlots(value: unknown, field: string): ComboSlotInput[] {
  if (!Array.isArray(value)) {
    throw new Error(field);
  }

  return value.map((row, slotIndex) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(field);
    }

    const record = row as {
      name?: unknown;
      translations?: unknown;
      minSelect?: unknown;
      maxSelect?: unknown;
      allowDuplicates?: unknown;
      sortIndex?: unknown;
      options?: unknown;
    };

    if (typeof record.name !== "string" || !record.name.trim()) {
      throw new Error(field);
    }

    if (
      typeof record.minSelect !== "number" ||
      !Number.isInteger(record.minSelect) ||
      record.minSelect < 0
    ) {
      throw new Error(field);
    }

    if (
      typeof record.maxSelect !== "number" ||
      !Number.isInteger(record.maxSelect) ||
      record.maxSelect < record.minSelect
    ) {
      throw new Error(field);
    }

    const allowDuplicates =
      record.allowDuplicates === undefined
        ? true
        : parseBoolean(record.allowDuplicates, field);
    const translations =
      record.translations === undefined
        ? null
        : parseTranslationsInput(record.translations, field);

    const sortIndex =
      record.sortIndex === undefined
        ? null
        : parseNullableInt(record.sortIndex, field);

    if (!Array.isArray(record.options) || record.options.length === 0) {
      throw new Error(field);
    }

    const uniqueOptionsByProductId = new Map<string, ComboSlotOptionInput>();

    for (let optionIndex = 0; optionIndex < record.options.length; optionIndex += 1) {
      const option = record.options[optionIndex];
      if (!option || typeof option !== "object" || Array.isArray(option)) {
        throw new Error(field);
      }

      const optionRecord = option as {
        productId?: unknown;
        extraPrice?: unknown;
        sortIndex?: unknown;
      };

      if (typeof optionRecord.productId !== "string" || !optionRecord.productId.trim()) {
        throw new Error(field);
      }

      const extraPrice =
        optionRecord.extraPrice === undefined
          ? 0
          : parseNullableInt(optionRecord.extraPrice, field);
      const optionSortIndex =
        optionRecord.sortIndex === undefined
          ? null
          : parseNullableInt(optionRecord.sortIndex, field);

      uniqueOptionsByProductId.set(optionRecord.productId.trim(), {
        productId: optionRecord.productId.trim(),
        extraPrice: extraPrice ?? 0,
        sortIndex: optionSortIndex ?? optionIndex + 1,
      });
    }

    const options = Array.from(uniqueOptionsByProductId.values());

    if (!allowDuplicates && record.maxSelect > options.length) {
      throw new Error(field);
    }

    return {
      name: record.name.trim(),
      translations,
      minSelect: record.minSelect,
      maxSelect: record.maxSelect,
      allowDuplicates,
      sortIndex: sortIndex ?? slotIndex + 1,
      options,
    };
  });
}

function parseLegacyComboItems(
  value: unknown,
  field: string,
): LegacyComboItemInput[] {
  if (!Array.isArray(value)) {
    throw new Error(field);
  }

  const items = new Map<string, LegacyComboItemInput>();

  for (const row of value) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(field);
    }

    const record = row as {
      productId?: unknown;
      quantity?: unknown;
    };

    if (typeof record.productId !== "string" || !record.productId.trim()) {
      throw new Error(field);
    }
    if (
      typeof record.quantity !== "number" ||
      !Number.isInteger(record.quantity) ||
      record.quantity <= 0
    ) {
      throw new Error(field);
    }

    items.set(record.productId.trim(), {
      productId: record.productId.trim(),
      quantity: record.quantity,
    });
  }

  return Array.from(items.values());
}

function parseUrlArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(field);
  }

  return Array.from(
    new Set(
      value.map((urlValue) => {
        if (typeof urlValue !== "string") {
          throw new Error(field);
        }

        const normalized = urlValue.trim();
        if (!normalized) {
          throw new Error(field);
        }

        let parsedUrl: URL;

        try {
          parsedUrl = new URL(normalized);
        } catch {
          throw new Error(field);
        }

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          throw new Error(field);
        }

        return parsedUrl.toString();
      }),
    ),
  );
}

function createId() {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildFileNameFromUrl(urlValue: string): string {
  try {
    const parsed = new URL(urlValue);
    const rawFileName = parsed.pathname.split("/").filter(Boolean).pop();

    if (rawFileName) {
      return decodeURIComponent(rawFileName);
    }
  } catch {
    // no-op
  }

  return "product-image";
}

export async function POST(request: NextRequest) {
  try {
    await ensureComboProductItemTable(prisma);

    const body = (await request.json()) as PostBody;
    const id = body.id === undefined ? createId() : parseString(body.id, "id");
    const name = parseString(body.name, "name");
    const visible =
      body.visible === undefined ? true : parseBoolean(body.visible, "visible");

    const description =
      body.description === undefined
        ? null
        : parseNullableString(body.description, "description");
    const price =
      body.price === undefined ? null : parseNullableInt(body.price, "price");
    const comparedAtPrice =
      body.comparedAtPrice === undefined
        ? null
        : parseNullableInt(body.comparedAtPrice, "comparedAtPrice");
    const itemType =
      body.itemType === undefined
        ? ("PRODUCT" as const)
        : parseProductItemType(body.itemType, "itemType");
    const comboSlotsFromBody =
      body.comboSlots === undefined
        ? null
        : parseComboSlots(body.comboSlots, "comboSlots");
    const legacyComboItems =
      body.comboItems === undefined
        ? null
        : parseLegacyComboItems(body.comboItems, "comboItems");
    const fixedComboProducts =
      body.products === undefined
        ? null
        : parseLegacyComboItems(body.products, "products");
    const comboSlots =
      comboSlotsFromBody ??
      (legacyComboItems
        ? legacyComboItems.map((item, index) => ({
            name: `Item ${index + 1}`,
            translations: null,
            minSelect: item.quantity,
            maxSelect: item.quantity,
            allowDuplicates: false,
            sortIndex: index + 1,
            options: [
              {
                productId: item.productId,
                extraPrice: 0,
                sortIndex: 1,
              },
            ],
          }))
        : []);
    const categoryIndex =
      body.categoryIndex === undefined
        ? null
        : parseNullableInt(body.categoryIndex, "categoryIndex");

    if (itemType !== "COMBO" && comboSlots.length > 0) {
      return NextResponse.json(
        { error: "Invalid payload", field: "comboSlots" },
        { status: 400 },
      );
    }

    if (itemType !== "COMBO" && (fixedComboProducts?.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Invalid payload", field: "products" },
        { status: 400 },
      );
    }

    if (
      itemType === "COMBO" &&
      comboSlots.some((slot) => slot.options.some((option) => option.productId === id))
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "comboSlots" },
        { status: 400 },
      );
    }

    if (
      itemType === "COMBO" &&
      (fixedComboProducts ?? []).some((item) => item.productId === id)
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "products" },
        { status: 400 },
      );
    }

    if (body.photoIds !== undefined && body.photoUrls !== undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "photoUrls" },
        { status: 400 },
      );
    }

    let categoryId: string | null = null;
    if (body.categoryId !== undefined) {
      categoryId = parseNullableString(body.categoryId, "categoryId");

      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: {
            id: categoryId,
          },
          select: {
            id: true,
          },
        });

        if (!category) {
          return NextResponse.json(
            { error: "Invalid payload", field: "categoryId" },
            { status: 400 },
          );
        }
      }
    }

    const categoryIdsFromBody =
      body.categoryIds === undefined
        ? []
        : parseIdArray(body.categoryIds, "categoryIds");
    const allCategoryIds = Array.from(
      new Set([...categoryIdsFromBody, ...(categoryId ? [categoryId] : [])]),
    );

    if (allCategoryIds.length > 0) {
      const categoryCount = await prisma.category.count({
        where: {
          id: {
            in: allCategoryIds,
          },
        },
      });

      if (categoryCount !== allCategoryIds.length) {
        return NextResponse.json(
          { error: "Invalid payload", field: "categoryIds" },
          { status: 400 },
        );
      }
    }

    const modifierGroupIds =
      body.modifierGroupIds === undefined
        ? []
        : parseIdArray(body.modifierGroupIds, "modifierGroupIds");

    if (modifierGroupIds.length > 0) {
      const modifierGroupCount = await prisma.modifierGroup.count({
        where: {
          id: {
            in: modifierGroupIds,
          },
        },
      });

      if (modifierGroupCount !== modifierGroupIds.length) {
        return NextResponse.json(
          { error: "Invalid payload", field: "modifierGroupIds" },
          { status: 400 },
        );
      }
    }

    const preparationStepIds =
      body.preparationStepIds === undefined
        ? []
        : parseIdArray(body.preparationStepIds, "preparationStepIds");

    if (preparationStepIds.length > 0) {
      const preparationStepCount = await prisma.preparationStep.count({
        where: {
          id: {
            in: preparationStepIds,
          },
        },
      });

      if (preparationStepCount !== preparationStepIds.length) {
        return NextResponse.json(
          { error: "Invalid payload", field: "preparationStepIds" },
          { status: 400 },
        );
      }
    }

    if (comboSlots.length > 0) {
      const comboProductIds = Array.from(
        new Set(
          comboSlots.flatMap((slot) =>
            slot.options.map((option) => option.productId),
          ),
        ),
      );
      const comboProductCount = await prisma.product.count({
        where: {
          id: {
            in: comboProductIds,
          },
        },
      });

      if (comboProductCount !== comboProductIds.length) {
        return NextResponse.json(
          { error: "Invalid payload", field: "comboSlots" },
          { status: 400 },
        );
      }
    }

    if ((fixedComboProducts?.length ?? 0) > 0) {
      const comboProductIds = Array.from(
        new Set((fixedComboProducts ?? []).map((item) => item.productId)),
      );
      const comboProductCount = await prisma.product.count({
        where: {
          id: {
            in: comboProductIds,
          },
        },
      });

      if (comboProductCount !== comboProductIds.length) {
        return NextResponse.json(
          { error: "Invalid payload", field: "products" },
          { status: 400 },
        );
      }
    }

    let photoIds: string[] = [];

    if (body.photoIds !== undefined) {
      photoIds = parseIdArray(body.photoIds, "photoIds");
      if (photoIds.length > 0) {
        const photoCount = await prisma.file.count({
          where: {
            id: {
              in: photoIds,
            },
          },
        });

        if (photoCount !== photoIds.length) {
          return NextResponse.json(
            { error: "Invalid payload", field: "photoIds" },
            { status: 400 },
          );
        }
      }
    } else if (body.photoUrls !== undefined) {
      const photoUrls = parseUrlArray(body.photoUrls, "photoUrls");
      const existingFiles = await prisma.file.findMany({
        where: {
          url: {
            in: photoUrls,
          },
        },
        select: {
          id: true,
          url: true,
        },
      });
      const existingFileIdByUrl = new Map(
        existingFiles.map((file) => [file.url, file.id]),
      );
      const missingUrls = photoUrls.filter(
        (urlValue) => !existingFileIdByUrl.has(urlValue),
      );
      const createdFiles =
        missingUrls.length === 0
          ? []
          : await Promise.all(
              missingUrls.map((urlValue) =>
                prisma.file.create({
                  data: {
                    id: createId(),
                    name: buildFileNameFromUrl(urlValue),
                    url: urlValue,
                    size: 0,
                  },
                  select: {
                    id: true,
                    url: true,
                  },
                }),
              ),
            );
      const createdFileIdByUrl = new Map(
        createdFiles.map((file) => [file.url, file.id]),
      );
      photoIds = photoUrls.map((urlValue) => {
        const fileId =
          existingFileIdByUrl.get(urlValue) || createdFileIdByUrl.get(urlValue);

        if (!fileId) {
          throw new Error("photoUrls");
        }

        return fileId;
      });
    }

    let translationsValue: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;
    if (body.translations !== undefined) {
      if (
        body.translations !== null &&
        (typeof body.translations !== "object" || Array.isArray(body.translations))
      ) {
        return NextResponse.json(
          { error: "Invalid payload", field: "translations" },
          { status: 400 },
        );
      }

      translationsValue =
        body.translations === null
          ? Prisma.JsonNull
          : (body.translations as Prisma.InputJsonValue);
    }

    const include = {
      photos: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
      modifierGroups: {
        include: {
          items: {
            include: {
              photo: {
                select: {
                  id: true,
                  url: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc" as const,
            },
          },
        },
      },
      preparationSteps: {
        select: {
          id: true,
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
            orderBy: [{ sortIndex: "asc" as const }, { createdAt: "asc" as const }],
          },
        },
        orderBy: [{ sortIndex: "asc" as const }, { createdAt: "asc" as const }],
      },
    };

    const createdProduct = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          id,
          itemType,
          name,
          visible,
          description,
          price,
          comparedAtPrice,
          categoryIndex,
          ...(categoryId
            ? {
                category: {
                  connect: {
                    id: categoryId,
                  },
                },
              }
            : {}),
          ...(translationsValue !== undefined
            ? { translations: translationsValue }
            : {}),
          ...(photoIds.length > 0
            ? {
                photos: {
                  connect: photoIds.map((photoId) => ({ id: photoId })),
                },
              }
            : {}),
          ...(modifierGroupIds.length > 0
            ? {
                modifierGroups: {
                  connect: modifierGroupIds.map((modifierGroupId) => ({
                    id: modifierGroupId,
                  })),
                },
              }
            : {}),
          ...(preparationStepIds.length > 0
            ? {
                preparationSteps: {
                  connect: preparationStepIds.map((preparationStepId) => ({
                    id: preparationStepId,
                  })),
                },
              }
            : {}),
        },
      });

      if (allCategoryIds.length > 0) {
        await tx.$executeRaw`
          INSERT INTO "ProductCategory" ("productId", "categoryId", "categoryIndex")
          VALUES ${Prisma.join(
            allCategoryIds.map((linkedCategoryId) => Prisma.sql`(${created.id}, ${linkedCategoryId}, ${categoryIndex})`),
          )}
          ON CONFLICT ("productId", "categoryId")
          DO UPDATE SET "categoryIndex" = EXCLUDED."categoryIndex"
        `;
      }

      await tx.comboSlot.deleteMany({
        where: {
          comboId: created.id,
        },
      });

      if (itemType === "COMBO" && comboSlots.length > 0) {
        for (let slotIndex = 0; slotIndex < comboSlots.length; slotIndex += 1) {
          const slot = comboSlots[slotIndex];
          const slotId = createId();

          await tx.comboSlot.create({
            data: {
              id: slotId,
              comboId: created.id,
              name: slot.name,
              translations: slot.translations ?? Prisma.JsonNull,
              minSelect: slot.minSelect,
              maxSelect: slot.maxSelect,
              allowDuplicates: slot.allowDuplicates,
              sortIndex: slot.sortIndex ?? slotIndex + 1,
            },
          });

          if (slot.options.length > 0) {
            await tx.comboSlotOption.createMany({
              data: slot.options.map((option, optionIndex) => ({
                id: createId(),
                slotId,
                productId: option.productId,
                extraPrice: option.extraPrice,
                sortIndex: option.sortIndex ?? optionIndex + 1,
              })),
            });
          }
        }
      }

      if (itemType === "COMBO") {
        await replaceComboProducts(
          tx,
          created.id,
          (fixedComboProducts ?? []).map((item, index) => ({
            productId: item.productId,
            quantity: item.quantity,
            sortIndex: index + 1,
          })) satisfies ComboProductInput[],
        );
      }

      return tx.product.findUniqueOrThrow({
        where: {
          id: created.id,
        },
        include,
      });
    });

    const createdProductCategoryRows = await prisma.$queryRaw<ProductCategoryEntry[]>`
      SELECT "productId", "categoryId", "categoryIndex"
      FROM "ProductCategory"
      WHERE "productId" = ${createdProduct.id}
      ORDER BY
        COALESCE("categoryIndex", 2147483647) ASC,
        "createdAt" ASC
    `;
    const createdProductDirectRows = await getComboProductsByComboIds(prisma, [
      createdProduct.id,
    ]);
    const directProducts: DirectComboProductResponse[] = createdProductDirectRows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
    }));

    return NextResponse.json(
      mapProductRow(createdProduct, createdProductCategoryRows, directProducts),
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
        { error: "Product already exists", field: "id" },
        { status: 409 },
      );
    }

    console.error("POST /api/products error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    await ensureComboProductItemTable(prisma);

    const [
      products,
      productVisibilityRows,
      categories,
      files,
      modifierGroups,
      preparationSteps,
      stations,
    ] =
      await Promise.all([
        prisma.product.findMany({
          include: {
            photos: {
              select: {
                id: true,
                name: true,
                url: true,
              },
            },
            modifierGroups: {
              include: {
                items: {
                  include: {
                    photo: {
                      select: {
                        id: true,
                        url: true,
                      },
                    },
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
            preparationSteps: {
              select: {
                id: true,
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
        prisma.category.findMany({
          select: {
            id: true,
            name: true,
            createdAt: true,
            menuIndex: true,
          },
          orderBy: [
            {
              menuIndex: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        }),
        prisma.file.findMany({
          select: {
            id: true,
            name: true,
            url: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        }),
        prisma.modifierGroup.findMany({
          include: {
            items: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                translations: true,
                createdAt: true,
                photo: {
                  select: {
                    id: true,
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
        prisma.preparationStep.findMany({
          select: {
            id: true,
            name: true,
            includeComments: true,
            includeModifiers: true,
            stationId: true,
            station: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        }),
        prisma.station.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        }),
      ]);

    const visibleByProductId = new Map(
      productVisibilityRows.map((row) => [row.id, row.visible]),
    );

    const productIds = products.map((product) => product.id);
    const productCategoryRows =
      productIds.length === 0
        ? []
        : await prisma.$queryRaw<ProductCategoryEntry[]>`
            SELECT "productId", "categoryId", "categoryIndex"
            FROM "ProductCategory"
            WHERE "productId" IN (${Prisma.join(productIds)})
            ORDER BY
              "productId" ASC,
              COALESCE("categoryIndex", 2147483647) ASC,
              "createdAt" ASC
          `;
    const productCategoriesByProductId = new Map<string, ProductCategoryEntry[]>();

    for (const row of productCategoryRows) {
      const current = productCategoriesByProductId.get(row.productId) ?? [];
      current.push(row);
      productCategoriesByProductId.set(row.productId, current);
    }
    const directComboProductRows = await getComboProductsByComboIds(
      prisma,
      productIds,
    );
    const directComboProductsByProductId = new Map<
      string,
      DirectComboProductResponse[]
    >();

    for (const row of directComboProductRows) {
      const current = directComboProductsByProductId.get(row.comboId) ?? [];
      current.push({
        productId: row.productId,
        productName: row.productName,
        quantity: row.quantity,
      });
      directComboProductsByProductId.set(row.comboId, current);
    }

    return NextResponse.json({
      products: products.map((product) =>
        mapProductRow(
          {
            ...product,
            visible:
              visibleByProductId.get(product.id) ??
              (product as typeof product & { visible?: boolean }).visible,
          },
          productCategoriesByProductId.get(product.id) ?? [],
          directComboProductsByProductId.get(product.id) ?? [],
        ),
      ),
      lookup: {
        categories,
        files,
        modifierGroups: modifierGroups.map((modifierGroup) => ({
          id: modifierGroup.id,
          title: modifierGroup.title,
          translations:
            (modifierGroup as typeof modifierGroup & {
              translations?: unknown | null;
            }).translations ?? null,
          items: modifierGroup.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            translations: item.translations ?? null,
            photo: item.photo
              ? {
                  id: item.photo.id,
                  url: item.photo.url,
                }
              : null,
            createdAt: item.createdAt.toISOString(),
          })),
        })),
        preparationSteps: preparationSteps.map((step) => ({
          id: step.id,
          name: step.name,
          includeComments: step.includeComments,
          includeModifiers: step.includeModifiers,
          stationId: step.stationId,
          stationName: step.station?.name || null,
        })),
        stations,
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
