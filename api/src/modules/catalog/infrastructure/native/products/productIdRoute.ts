import prisma from "../../../../../prisma.js";
import { ensureComboProductItemTable, getComboProductsByComboIds, replaceComboProducts, type ComboProductInput, } from "../persistence/comboProductsStore.js";
import type { HttpResponse } from "../../../../../shared/http/types.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";
import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

type PatchBody = {
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

type ProductVisibleRow = {
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
}, productCategoryEntries: ProductCategoryEntry[], directComboProducts: DirectComboProductResponse[]) {
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

function parseNullableString(
  value: unknown,
  field: string,
): string | null {
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();

  return normalized ? normalized : null;
}

function parseNullableInt(
  value: unknown,
  field: string,
): number | null {
  if (value === null) return null;
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

  const normalizedIds = Array.from(
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

  return normalizedIds;
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

function generateId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
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

export async function PATCH(request: NextRequestLike, context: RouteContext) {
  try {
    await ensureComboProductItemTable(prisma);

    const { productId } = await context.params;
    const normalizedProductId = productId.trim();

    if (!normalizedProductId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "productId" },
        { status: 400 },
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id: normalizedProductId,
      },
      select: {
        id: true,
        itemType: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = (await request.json()) as PatchBody;
    const data: Prisma.ProductUpdateInput = {};
    let visibleToPersist: boolean | undefined = undefined;
    let itemTypeToPersist: ProductItemType | undefined = undefined;
    let comboSlotsToPersist: ComboSlotInput[] | null = null;
    let comboProductsToPersist: LegacyComboItemInput[] | null = null;
    let hasAnyField = false;

    if (body.photoIds !== undefined && body.photoUrls !== undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "photoUrls" },
        { status: 400 },
      );
    }

    if (body.name !== undefined) {
      data.name = parseString(body.name, "name");
      hasAnyField = true;
    }

    if (body.visible !== undefined) {
      visibleToPersist = parseBoolean(body.visible, "visible");
      hasAnyField = true;
    }

    if (body.description !== undefined) {
      data.description = parseNullableString(body.description, "description");
      hasAnyField = true;
    }

    if (body.price !== undefined) {
      data.price = parseNullableInt(body.price, "price");
      hasAnyField = true;
    }

    if (body.comparedAtPrice !== undefined) {
      data.comparedAtPrice = parseNullableInt(
        body.comparedAtPrice,
        "comparedAtPrice",
      );
      hasAnyField = true;
    }

    if (body.itemType !== undefined) {
      itemTypeToPersist = parseProductItemType(body.itemType, "itemType");
      data.itemType = itemTypeToPersist;
      hasAnyField = true;
    }

    if (
      body.comboSlots !== undefined ||
      body.comboItems !== undefined ||
      body.products !== undefined
    ) {
      if (body.comboSlots !== undefined) {
        comboSlotsToPersist = parseComboSlots(body.comboSlots, "comboSlots");
      } else if (body.products !== undefined) {
        comboProductsToPersist = parseLegacyComboItems(body.products, "products");
      } else {
        const legacyComboItems = parseLegacyComboItems(body.comboItems, "comboItems");
        comboSlotsToPersist = legacyComboItems.map((item, index) => ({
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
        }));
      }
      hasAnyField = true;
    }

    if (body.categoryIndex !== undefined) {
      data.categoryIndex = parseNullableInt(body.categoryIndex, "categoryIndex");
      hasAnyField = true;
    }

    let categoryIdsFromBody: string[] | null = null;
    if (body.categoryIds !== undefined) {
      categoryIdsFromBody = parseIdArray(body.categoryIds, "categoryIds");
      hasAnyField = true;
    }

    if (body.translations !== undefined) {
      if (
        body.translations !== null &&
        (typeof body.translations !== "object" ||
          Array.isArray(body.translations))
      ) {
        return NextResponse.json(
          { error: "Invalid payload", field: "translations" },
          { status: 400 },
        );
      }

      if (body.translations === null) {
        data.translations = Prisma.JsonNull;
      } else {
        data.translations = body.translations as Prisma.InputJsonValue;
      }
      hasAnyField = true;
    }

    if (body.categoryId !== undefined) {
      const categoryId = parseNullableString(body.categoryId, "categoryId");

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

        data.category = {
          connect: {
            id: categoryId,
          },
        };
      } else {
        data.category = {
          disconnect: true,
        };
      }

      hasAnyField = true;
    }

    let categoryIdsToLink: string[] | null = null;
    if (categoryIdsFromBody !== null || body.categoryId !== undefined) {
      categoryIdsToLink = Array.from(
        new Set([
          ...(categoryIdsFromBody ?? []),
          ...(typeof body.categoryId === "string" && body.categoryId.trim()
            ? [body.categoryId.trim()]
            : []),
        ]),
      );

      if (categoryIdsToLink.length > 0) {
        const categoryCount = await prisma.category.count({
          where: {
            id: {
              in: categoryIdsToLink,
            },
          },
        });

        if (categoryCount !== categoryIdsToLink.length) {
          return NextResponse.json(
            { error: "Invalid payload", field: "categoryIds" },
            { status: 400 },
          );
        }
      }
    }

    if (body.photoIds !== undefined) {
      const photoIds = parseIdArray(body.photoIds, "photoIds");
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

      data.photos = {
        set: photoIds.map((id) => ({ id })),
      };
      hasAnyField = true;
    }

    if (body.photoUrls !== undefined) {
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
                    id: generateId(),
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
      const allPhotoIds = photoUrls.map((urlValue) => {
        const fileId =
          existingFileIdByUrl.get(urlValue) || createdFileIdByUrl.get(urlValue);

        if (!fileId) {
          throw new Error("photoUrls");
        }

        return fileId;
      });

      data.photos = {
        set: allPhotoIds.map((id) => ({ id })),
      };
      hasAnyField = true;
    }

    if (body.modifierGroupIds !== undefined) {
      const modifierGroupIds = parseIdArray(
        body.modifierGroupIds,
        "modifierGroupIds",
      );
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

      data.modifierGroups = {
        set: modifierGroupIds.map((id) => ({ id })),
      };
      hasAnyField = true;
    }

    if (body.preparationStepIds !== undefined) {
      const preparationStepIds = parseIdArray(
        body.preparationStepIds,
        "preparationStepIds",
      );
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

      data.preparationSteps = {
        set: preparationStepIds.map((id) => ({ id })),
      };
      hasAnyField = true;
    }

    const resolvedItemType = itemTypeToPersist ?? existingProduct.itemType;

    if (
      comboSlotsToPersist !== null &&
      resolvedItemType !== "COMBO" &&
      comboSlotsToPersist.length > 0
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "comboSlots" },
        { status: 400 },
      );
    }

    if (
      comboProductsToPersist !== null &&
      resolvedItemType !== "COMBO" &&
      comboProductsToPersist.length > 0
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "products" },
        { status: 400 },
      );
    }

    if (
      comboSlotsToPersist !== null &&
      comboSlotsToPersist.some((slot) =>
        slot.options.some((option) => option.productId === normalizedProductId),
      )
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "comboSlots" },
        { status: 400 },
      );
    }

    if (
      comboProductsToPersist !== null &&
      comboProductsToPersist.some(
        (product) => product.productId === normalizedProductId,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "products" },
        { status: 400 },
      );
    }

    if (comboSlotsToPersist !== null && comboSlotsToPersist.length > 0) {
      const comboProductIds = Array.from(
        new Set(
          comboSlotsToPersist.flatMap((slot) =>
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

    if (comboProductsToPersist !== null && comboProductsToPersist.length > 0) {
      const comboProductIds = Array.from(
        new Set(comboProductsToPersist.map((item) => item.productId)),
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

    if (!hasAnyField) {
      return NextResponse.json(
        { error: "Invalid payload", field: "body" },
        { status: 400 },
      );
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

    const hasPrismaUpdatableFields = Object.keys(data).length > 0;
    const updatedProduct = hasPrismaUpdatableFields
      ? await prisma.product.update({
          where: {
            id: normalizedProductId,
          },
          data,
          include,
        })
      : await prisma.product.findUnique({
          where: {
            id: normalizedProductId,
          },
          include,
        });

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (visibleToPersist !== undefined) {
      await prisma.$executeRaw`
        UPDATE "Product"
        SET "visible" = ${visibleToPersist}
        WHERE "id" = ${normalizedProductId}
      `;
    }

    if (categoryIdsToLink !== null) {
      await prisma.$transaction(async (tx) => {
        if (categoryIdsToLink.length === 0) {
          await tx.$executeRaw`
            DELETE FROM "ProductCategory"
            WHERE "productId" = ${normalizedProductId}
          `;
        } else {
          await tx.$executeRaw`
            DELETE FROM "ProductCategory"
            WHERE "productId" = ${normalizedProductId}
              AND "categoryId" NOT IN (${Prisma.join(categoryIdsToLink)})
          `;
        }

        for (const linkedCategoryId of categoryIdsToLink) {
          const parsedCategoryIndex =
            body.categoryIndex !== undefined
              ? parseNullableInt(body.categoryIndex, "categoryIndex")
              : null;

          await tx.$executeRaw`
            INSERT INTO "ProductCategory" ("productId", "categoryId", "categoryIndex")
            VALUES (${normalizedProductId}, ${linkedCategoryId}, ${parsedCategoryIndex})
            ON CONFLICT ("productId", "categoryId")
            DO UPDATE SET
              "categoryIndex" = COALESCE(
                EXCLUDED."categoryIndex",
                "ProductCategory"."categoryIndex"
              )
          `;
        }
      });
    } else if (
      body.categoryIndex !== undefined &&
      updatedProduct.categoryId
    ) {
      const parsedCategoryIndex = parseNullableInt(body.categoryIndex, "categoryIndex");
      await prisma.$executeRaw`
        INSERT INTO "ProductCategory" ("productId", "categoryId", "categoryIndex")
        VALUES (${normalizedProductId}, ${updatedProduct.categoryId}, ${parsedCategoryIndex})
        ON CONFLICT ("productId", "categoryId")
        DO UPDATE SET "categoryIndex" = EXCLUDED."categoryIndex"
      `;
    }

    if (
      resolvedItemType === "PRODUCT" ||
      comboSlotsToPersist !== null ||
      comboProductsToPersist !== null
    ) {
      await prisma.$transaction(async (tx) => {
        await tx.comboSlot.deleteMany({
          where: {
            comboId: normalizedProductId,
          },
        });

        if (resolvedItemType === "COMBO" && comboSlotsToPersist && comboSlotsToPersist.length > 0) {
          for (let slotIndex = 0; slotIndex < comboSlotsToPersist.length; slotIndex += 1) {
            const slot = comboSlotsToPersist[slotIndex];
            const slotId = generateId();

            await tx.comboSlot.create({
              data: {
                id: slotId,
                comboId: normalizedProductId,
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
                  id: generateId(),
                  slotId,
                  productId: option.productId,
                  extraPrice: option.extraPrice,
                  sortIndex: option.sortIndex ?? optionIndex + 1,
                })),
              });
            }
          }
        }

        if (resolvedItemType === "PRODUCT") {
          await replaceComboProducts(tx, normalizedProductId, []);
          return;
        }

        if (comboProductsToPersist !== null) {
          await replaceComboProducts(
            tx,
            normalizedProductId,
            comboProductsToPersist.map((item, index) => ({
              productId: item.productId,
              quantity: item.quantity,
              sortIndex: index + 1,
            })) satisfies ComboProductInput[],
          );
        }
      });
    }

    const [visibleRow] = await prisma.$queryRaw<ProductVisibleRow[]>`
      SELECT "visible"
      FROM "Product"
      WHERE "id" = ${normalizedProductId}
      LIMIT 1
    `;

    const refreshedProduct = await prisma.product.findUniqueOrThrow({
      where: {
        id: normalizedProductId,
      },
      include,
    });
    const productCategoryRows = await prisma.$queryRaw<ProductCategoryEntry[]>`
      SELECT "productId", "categoryId", "categoryIndex"
      FROM "ProductCategory"
      WHERE "productId" = ${normalizedProductId}
      ORDER BY
        COALESCE("categoryIndex", 2147483647) ASC,
        "createdAt" ASC
    `;
    const directComboProductRows = await getComboProductsByComboIds(prisma, [
      normalizedProductId,
    ]);
    const directProducts: DirectComboProductResponse[] = directComboProductRows.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
    }));

    return NextResponse.json(
      mapProductRow(
        {
          ...refreshedProduct,
          visible: visibleRow?.visible ?? visibleToPersist ?? refreshedProduct.visible,
        },
        productCategoryRows,
        directProducts,
      ),
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
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.error("PATCH /api/products/[productId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
