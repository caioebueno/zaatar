import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

type ProductVisibleRow = {
  id: string;
  visible: boolean;
};

type PostBody = {
  id?: unknown;
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

type ProductRowResponse = {
  id: string;
  createdAt: string;
  name: string;
  visible: boolean;
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
}): ProductRowResponse {
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
    const categoryIndex =
      body.categoryIndex === undefined
        ? null
        : parseNullableInt(body.categoryIndex, "categoryIndex");

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
    };

    const createdProduct = await prisma.product.create({
      data: {
        id,
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
      include,
    });

    return NextResponse.json(mapProductRow(createdProduct), { status: 201 });
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

    return NextResponse.json({
      products: products.map((product) =>
        mapProductRow({
          ...product,
          visible:
            visibleByProductId.get(product.id) ??
            (product as typeof product & { visible?: boolean }).visible,
        }),
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
