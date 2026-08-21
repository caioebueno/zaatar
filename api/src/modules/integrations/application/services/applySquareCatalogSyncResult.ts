import prisma from "../../../../prisma.js";
import type { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import type { SquareBatchUpsertResult } from "../ports/SquareCatalogGateway.js";
import type { SquareTrackedEntity } from "./buildSquareCatalogMenus.js";

type SquareCatalogObjectLike = {
  id?: string;
  version?: number | string | null;
  item_data?: {
    variations?: Array<SquareCatalogObjectLike>;
  } | null;
  modifier_list_data?: {
    modifiers?: Array<SquareCatalogObjectLike>;
  } | null;
};

const PERSISTENCE_BATCH_SIZE = 20;

export async function applySquareCatalogSyncResult(input: {
  result: SquareBatchUpsertResult;
  trackedEntities: SquareTrackedEntity[];
}): Promise<void> {
  const resolvedIdsByRequestObjectId = new Map<string, string>();

  for (const mapping of input.result.idMappings) {
    if (mapping.clientObjectId && mapping.objectId) {
      resolvedIdsByRequestObjectId.set(mapping.clientObjectId, mapping.objectId);
    }
  }

  const versionsByObjectId = new Map<string, string>();
  const rawResponse = input.result.rawResponse as
    | {
        objects?: SquareCatalogObjectLike[];
      }
    | undefined;

  for (const object of rawResponse?.objects ?? []) {
    collectSquareObjectVersions(object, versionsByObjectId);
  }

  const operations = input.trackedEntities.flatMap((entity) => {
    const squareId =
      resolvedIdsByRequestObjectId.get(entity.requestObjectId) ??
      (entity.requestObjectId.startsWith("#") ? null : entity.requestObjectId);

    const squareVersion = squareId ? versionsByObjectId.get(squareId) ?? null : null;

    if (!squareId) {
      return [];
    }

    if (entity.entityType === "MENU_CATEGORY") {
      const data: Prisma.MenuCategoryUncheckedUpdateInput = {
        squareMenuCategoryId: squareId,
        squareMenuCategoryVersion: squareVersion,
      };

      return prisma.menuCategory.update({
        where: {
          menuId_categoryId: {
            menuId: entity.menuId,
            categoryId: entity.categoryId,
          },
        },
        data,
      });
    }

    if (entity.entityType === "REGULAR_CATEGORY") {
      const data: Prisma.MenuCategoryUncheckedUpdateInput = {
        squareCategoryId: squareId,
        squareCategoryVersion: squareVersion,
      };

      return prisma.menuCategory.update({
        where: {
          menuId_categoryId: {
            menuId: entity.menuId,
            categoryId: entity.categoryId,
          },
        },
        data,
      });
    }

    if (entity.entityType === "MENU_ROOT") {
      const data: Prisma.MenuUncheckedUpdateInput = {
        squareMenuId: squareId,
        squareMenuVersion: squareVersion,
      };

      return prisma.menu.update({
        where: {
          id: entity.menuId,
        },
        data,
      });
    }

    if (entity.entityType === "PRODUCT_ITEM") {
      const data: Prisma.ProductUncheckedUpdateInput = {
        squareItemId: squareId,
        squareItemVersion: squareVersion,
      };

      return prisma.product.update({
        where: {
          id: entity.productId,
        },
        data,
      });
    }

    if (entity.entityType === "PRODUCT_VARIATION") {
      const data: Prisma.ProductUncheckedUpdateInput = {
        squareVariationId: squareId,
        squareVariationVersion: squareVersion,
      };

      return prisma.product.update({
        where: {
          id: entity.productId,
        },
        data,
      });
    }

    if (entity.entityType === "MODIFIER_GROUP") {
      const data: Prisma.ModifierGroupUncheckedUpdateInput = {
        squareModifierListId: squareId,
        squareModifierListVersion: squareVersion,
      };

      return prisma.modifierGroup.update({
        where: {
          id: entity.modifierGroupId,
        },
        data,
      });
    }

    const data: Prisma.ModifierGroupItemUncheckedUpdateInput = {
      squareModifierId: squareId,
      squareModifierVersion: squareVersion,
    };

    return prisma.modifierGroupItem.update({
      where: {
        id: entity.modifierGroupItemId,
      },
      data,
    });
  });

  if (operations.length === 0) {
    return;
  }

  for (let index = 0; index < operations.length; index += PERSISTENCE_BATCH_SIZE) {
    const batch = operations.slice(index, index + PERSISTENCE_BATCH_SIZE);
    await Promise.all(batch);
  }
}

function collectSquareObjectVersions(
  object: SquareCatalogObjectLike,
  versionsByObjectId: Map<string, string>,
) {
  if (object.id) {
    const version = normalizeVersion(object.version);
    if (version) {
      versionsByObjectId.set(object.id, version);
    }
  }

  for (const variation of object.item_data?.variations ?? []) {
    collectSquareObjectVersions(variation, versionsByObjectId);
  }

  for (const modifier of object.modifier_list_data?.modifiers ?? []) {
    collectSquareObjectVersions(modifier, versionsByObjectId);
  }
}

function normalizeVersion(value: number | string | null | undefined): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return null;
}
