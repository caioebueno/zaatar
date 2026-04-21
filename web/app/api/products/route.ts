import prisma from "@/prisma";
import { NextResponse } from "next/server";

type ProductVisibleRow = {
  id: string;
  visible: boolean;
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
