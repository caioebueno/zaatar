import prisma from "@/prisma";
import { NextResponse } from "next/server";

type ProductRowResponse = {
  id: string;
  createdAt: string;
  name: string;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  translations: unknown | null;
  photoIds: string[];
  modifierGroupIds: string[];
  modifierGroups: {
    id: string;
    title: string;
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
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  translations: unknown | null;
  photos: { id: string }[];
  modifierGroups: {
    id: string;
    title: string;
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
    description: product.description,
    price: product.price,
    comparedAtPrice: product.comparedAtPrice,
    categoryId: product.categoryId,
    categoryIndex: product.categoryIndex,
    translations: product.translations,
    photoIds: product.photos.map((photo) => photo.id),
    modifierGroupIds: product.modifierGroups.map((modifierGroup) => modifierGroup.id),
    modifierGroups: product.modifierGroups.map((modifierGroup) => ({
      id: modifierGroup.id,
      title: modifierGroup.title,
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
          select: {
            id: true,
            title: true,
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

    return NextResponse.json({
      products: products.map(mapProductRow),
      lookup: {
        categories,
        files,
        modifierGroups,
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
