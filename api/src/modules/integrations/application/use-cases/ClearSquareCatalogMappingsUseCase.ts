import prisma from "../../../../prisma.js";

type ClearSquareCatalogMappingsInput = {
  dryRun?: boolean;
};

export type ClearSquareCatalogMappingsOutput = {
  counts: {
    menuCategories: number;
    menus: number;
    modifierGroupItems: number;
    modifierGroups: number;
    products: number;
  };
  dryRun: boolean;
  success: boolean;
};

export class ClearSquareCatalogMappingsUseCase {
  async execute(
    input: ClearSquareCatalogMappingsInput = {},
  ): Promise<ClearSquareCatalogMappingsOutput> {
    const counts = await loadSquareCatalogMappingCounts();

    if (input.dryRun) {
      return {
        success: true,
        dryRun: true,
        counts,
      };
    }

    await clearStoredSquareCatalogMappings();

    return {
      success: true,
      dryRun: false,
      counts,
    };
  }
}

export async function loadSquareCatalogMappingCounts(): Promise<
  ClearSquareCatalogMappingsOutput["counts"]
> {
  const [menus, menuCategories, products, modifierGroups, modifierGroupItems] =
    await Promise.all([
      prisma.menu.count({
        where: {
          OR: [{ squareMenuId: { not: null } }, { squareMenuVersion: { not: null } }],
        },
      }),
      prisma.menuCategory.count({
        where: {
          OR: [
            { squareCategoryId: { not: null } },
            { squareCategoryVersion: { not: null } },
            { squareMenuCategoryId: { not: null } },
            { squareMenuCategoryVersion: { not: null } },
          ],
        },
      }),
      prisma.product.count({
        where: {
          OR: [
            { squareItemId: { not: null } },
            { squareItemVersion: { not: null } },
            { squareVariationId: { not: null } },
            { squareVariationVersion: { not: null } },
          ],
        },
      }),
      prisma.modifierGroup.count({
        where: {
          OR: [
            { squareModifierListId: { not: null } },
            { squareModifierListVersion: { not: null } },
          ],
        },
      }),
      prisma.modifierGroupItem.count({
        where: {
          OR: [
            { squareModifierId: { not: null } },
            { squareModifierVersion: { not: null } },
          ],
        },
      }),
    ]);

  return {
    menus,
    menuCategories,
    products,
    modifierGroups,
    modifierGroupItems,
  };
}

export async function clearStoredSquareCatalogMappings(): Promise<void> {
  await prisma.$transaction([
    prisma.menu.updateMany({
      where: {},
      data: {
        squareMenuId: null,
        squareMenuVersion: null,
      },
    }),
    prisma.menuCategory.updateMany({
      where: {},
      data: {
        squareCategoryId: null,
        squareCategoryVersion: null,
        squareMenuCategoryId: null,
        squareMenuCategoryVersion: null,
      },
    }),
    prisma.product.updateMany({
      where: {},
      data: {
        squareItemId: null,
        squareItemVersion: null,
        squareVariationId: null,
        squareVariationVersion: null,
      },
    }),
    prisma.modifierGroup.updateMany({
      where: {},
      data: {
        squareModifierListId: null,
        squareModifierListVersion: null,
      },
    }),
    prisma.modifierGroupItem.updateMany({
      where: {},
      data: {
        squareModifierId: null,
        squareModifierVersion: null,
      },
    }),
  ]);
}
