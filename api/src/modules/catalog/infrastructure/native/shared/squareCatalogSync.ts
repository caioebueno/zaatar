import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../../prisma.js";
import type { SquareCatalogSyncTaskView } from "../../../../integrations/application/ports/SquareCatalogSyncTaskRepository.js";
import { PrismaSquareCatalogSyncTaskRepository } from "../../../../integrations/infrastructure/prisma/PrismaSquareCatalogSyncTaskRepository.js";
import { PrismaSquareConnectionRepository } from "../../../../integrations/infrastructure/prisma/PrismaSquareConnectionRepository.js";
import { triggerSquareCatalogSyncTaskProcessing } from "../../../../integrations/main/runSquareCatalogSyncTasks.js";

const squareCatalogSyncTaskRepository = new PrismaSquareCatalogSyncTaskRepository();
const squareConnectionRepository = new PrismaSquareConnectionRepository();

export async function enqueueSquareProductSyncTask(input: {
  businessId: string | null | undefined;
  productId: string;
  requestPayload?: unknown;
}): Promise<SquareCatalogSyncTaskView | null> {
  const businessId = normalizeId(input.businessId);
  const productId = normalizeId(input.productId);

  if (!businessId || !productId) {
    return null;
  }

  if (!(await hasSquareConnection(businessId))) {
    return null;
  }

  const task = await squareCatalogSyncTaskRepository.createProductUpdateTask({
    businessId,
    productId,
    requestPayload: input.requestPayload,
  });

  triggerSquareCatalogSyncTaskProcessing(5);
  return task;
}

export async function enqueueSquareMenuSyncTasks(input: {
  businessId: string | null | undefined;
  menuIds: string[];
  requestPayload?: unknown;
}): Promise<SquareCatalogSyncTaskView[]> {
  const businessId = normalizeId(input.businessId);
  const menuIds = Array.from(
    new Set(input.menuIds.map((menuId) => normalizeId(menuId)).filter((menuId): menuId is string => Boolean(menuId))),
  );

  if (!businessId || menuIds.length === 0) {
    return [];
  }

  if (!(await hasSquareConnection(businessId))) {
    return [];
  }

  const tasks = await Promise.all(
    menuIds.map((menuId) =>
      squareCatalogSyncTaskRepository.createMenuUpdateTask({
        businessId,
        menuId,
        requestPayload: input.requestPayload,
      }),
    ),
  );

  if (tasks.length > 0) {
    triggerSquareCatalogSyncTaskProcessing(Math.max(5, tasks.length));
  }

  return tasks;
}

export async function enqueueSquareCategorySync(input: {
  businessId: string | null | undefined;
  categoryId?: string | null;
  menuIds?: string[];
  requestPayload?: unknown;
}): Promise<SquareCatalogSyncTaskView[]> {
  const menuIds =
    input.menuIds && input.menuIds.length > 0
      ? input.menuIds
      : input.categoryId
        ? await loadMenuIdsForCategory(input.categoryId)
        : [];

  return enqueueSquareMenuSyncTasks({
    businessId: input.businessId,
    menuIds,
    requestPayload: input.requestPayload,
  });
}

export async function enqueueSquareModifierGroupSync(input: {
  businessId: string | null | undefined;
  modifierGroupIds: string[];
  requestPayload?: unknown;
}): Promise<SquareCatalogSyncTaskView[]> {
  const productIds = await loadProductIdsForModifierGroups(input.modifierGroupIds);
  const menuIds = await loadRelatedMenuIdsForProducts(productIds);

  return enqueueSquareMenuSyncTasks({
    businessId: input.businessId,
    menuIds,
    requestPayload: input.requestPayload,
  });
}

async function hasSquareConnection(businessId: string): Promise<boolean> {
  const squareConnection = await squareConnectionRepository.findByBusinessId(businessId);
  return Boolean(squareConnection);
}

async function loadMenuIdsForCategory(categoryId: string): Promise<string[]> {
  const normalizedCategoryId = normalizeId(categoryId);
  if (!normalizedCategoryId) {
    return [];
  }

  const rows = await prisma.$queryRaw<Array<{ menuId: string | null }>>`
    SELECT DISTINCT source."menuId" AS "menuId"
    FROM (
      SELECT category."menuId"
      FROM "Category" category
      WHERE category."id" = ${normalizedCategoryId}

      UNION

      SELECT menu_category."menuId"
      FROM "MenuCategory" menu_category
      WHERE menu_category."categoryId" = ${normalizedCategoryId}
    ) source
    WHERE source."menuId" IS NOT NULL
  `;

  return Array.from(
    new Set(
      rows
        .map((row) => normalizeId(row.menuId))
        .filter((menuId): menuId is string => Boolean(menuId)),
    ),
  );
}

async function loadProductIdsForModifierGroups(modifierGroupIds: string[]): Promise<string[]> {
  const normalizedModifierGroupIds = Array.from(
    new Set(
      modifierGroupIds
        .map((modifierGroupId) => normalizeId(modifierGroupId))
        .filter((modifierGroupId): modifierGroupId is string => Boolean(modifierGroupId)),
    ),
  );

  if (normalizedModifierGroupIds.length === 0) {
    return [];
  }

  const groups = await prisma.modifierGroup.findMany({
    where: {
      id: {
        in: normalizedModifierGroupIds,
      },
    },
    select: {
      products: {
        select: {
          id: true,
        },
      },
    },
  });

  return Array.from(
    new Set(groups.flatMap((group) => group.products.map((product) => product.id.trim())).filter(Boolean)),
  );
}

async function loadRelatedMenuIdsForProducts(productIds: string[]): Promise<string[]> {
  const normalizedProductIds = Array.from(
    new Set(
      productIds
        .map((productId) => normalizeId(productId))
        .filter((productId): productId is string => Boolean(productId)),
    ),
  );

  if (normalizedProductIds.length === 0) {
    return [];
  }

  const rows = await prisma.$queryRaw<Array<{ menuId: string | null }>>`
    SELECT DISTINCT source."menuId" AS "menuId"
    FROM (
      SELECT category."menuId"
      FROM "Product" product
      INNER JOIN "Category" category ON category."id" = product."categoryId"
      WHERE product."id" IN (${Prisma.join(normalizedProductIds)})

      UNION

      SELECT category."menuId"
      FROM "ProductCategory" product_category
      INNER JOIN "Category" category ON category."id" = product_category."categoryId"
      WHERE product_category."productId" IN (${Prisma.join(normalizedProductIds)})

      UNION

      SELECT menu_category."menuId"
      FROM "ProductCategory" product_category
      INNER JOIN "MenuCategory" menu_category
        ON menu_category."categoryId" = product_category."categoryId"
      WHERE product_category."productId" IN (${Prisma.join(normalizedProductIds)})
    ) source
    WHERE source."menuId" IS NOT NULL
  `;

  return Array.from(
    new Set(
      rows
        .map((row) => normalizeId(row.menuId))
        .filter((menuId): menuId is string => Boolean(menuId)),
    ),
  );
}

function normalizeId(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
