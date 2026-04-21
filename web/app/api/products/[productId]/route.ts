import prisma from "@/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/src/generated/prisma";

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
  categoryIndex?: unknown;
  translations?: unknown;
  photoIds?: unknown;
  photoUrls?: unknown;
  modifierGroupIds?: unknown;
  preparationStepIds?: unknown;
};

type ProductVisibleRow = {
  visible: boolean;
};

function mapProductRow(product: {
  id: string;
  createdAt: Date;
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
}) {
  return {
    id: product.id,
    createdAt: product.createdAt.toISOString(),
    name: product.name,
    visible: product.visible !== false,
    description: product.description,
    price: product.price,
    comparedAtPrice: product.comparedAtPrice,
    categoryId: product.categoryId,
    categoryIndex: product.categoryIndex,
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const normalizedProductId = productId.trim();

    if (!normalizedProductId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "productId" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as PatchBody;
    const data: Prisma.ProductUpdateInput = {};
    let visibleToPersist: boolean | undefined = undefined;
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

    if (body.categoryIndex !== undefined) {
      data.categoryIndex = parseNullableInt(body.categoryIndex, "categoryIndex");
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

    const [visibleRow] = await prisma.$queryRaw<ProductVisibleRow[]>`
      SELECT "visible"
      FROM "Product"
      WHERE "id" = ${normalizedProductId}
      LIMIT 1
    `;

    return NextResponse.json(
      mapProductRow({
        ...updatedProduct,
        visible: visibleRow?.visible ?? visibleToPersist ?? undefined,
      }),
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
