import { randomUUID } from "node:crypto";
import type { SquareCatalogGateway } from "../ports/SquareCatalogGateway.js";
import {
  buildSquareCatalogMenus,
  type BuiltSquareCatalogMenu,
  type SquareTrackedEntity,
} from "../services/buildSquareCatalogMenus.js";
import { applySquareCatalogSyncResult } from "../services/applySquareCatalogSyncResult.js";

type PublishSquareMenusInput = {
  accessToken?: string;
  activeOnly?: boolean;
  dryRun?: boolean;
  includeHiddenProducts?: boolean;
  menuIds?: string[];
};

type PublishSquareMenuResult = {
  counts: BuiltSquareCatalogMenu["counts"];
  error?: string;
  idMappingsCount?: number;
  menuId: string;
  menuName: string;
  success: boolean;
};

export type PublishSquareMenusOutput = {
  counts: {
    categoriesCount: number;
    itemsCount: number;
    modifierGroupsCount: number;
    modifierItemsCount: number;
    objectCount: number;
  };
  dryRun: boolean;
  environment: "PRODUCTION" | "SANDBOX";
  idMappingsCount?: number;
  menus: PublishSquareMenuResult[];
  success: boolean;
};

export class PublishSquareMenusUseCase {
  constructor(private readonly squareCatalogGateway: SquareCatalogGateway) {}

  async execute(
    input: PublishSquareMenusInput = {},
  ): Promise<PublishSquareMenusOutput> {
    const built = await buildSquareCatalogMenus({
      activeOnly: input.activeOnly,
      includeHiddenProducts: input.includeHiddenProducts,
      menuIds: input.menuIds,
    });

    const environment = resolveSquareEnvironment();

    if (input.dryRun) {
      return {
        success: true,
        dryRun: true,
        environment,
        counts: built.counts,
        menus: built.menus.map((menu) => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          counts: menu.counts,
          success: true,
        })),
      };
    }

    if (built.objects.length === 0) {
      return {
        success: true,
        dryRun: false,
        environment,
        counts: built.counts,
        idMappingsCount: 0,
        menus: built.menus.map((menu) => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          counts: menu.counts,
          success: true,
        })),
      };
    }

    try {
      const objects = await hydrateSquareObjectVersions({
        accessToken: input.accessToken,
        objects: built.objects,
        squareCatalogGateway: this.squareCatalogGateway,
      });

      const result = await retrySquareBatchUpsertOnVersionMismatch(
        () =>
          this.squareCatalogGateway.batchUpsertCatalogObjects({
            accessToken: input.accessToken,
            idempotencyKey: randomUUID(),
            objects,
          }),
      );

      await applySquareCatalogSyncResult({
        result,
        trackedEntities: built.trackedEntities,
      });

      await syncSquareProductImages({
        accessToken: input.accessToken,
        productImages: built.productImages,
        result,
        squareCatalogGateway: this.squareCatalogGateway,
        trackedEntities: built.trackedEntities,
      });

      return {
        success: true,
        dryRun: false,
        environment,
        counts: built.counts,
        idMappingsCount: result.idMappings.length,
        menus: built.menus.map((menu) => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          counts: menu.counts,
          success: true,
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "SQUARE_SYNC_FAILED";

      return {
        success: false,
        dryRun: false,
        environment,
        counts: built.counts,
        menus: built.menus.map((menu) => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          counts: menu.counts,
          success: false,
          error: message,
        })),
      };
    }
  }
}

async function retrySquareBatchUpsertOnVersionMismatch<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isSquareVersionMismatchError(error) || attempt >= maxAttempts) {
        throw error;
      }

      await delay(attempt * 250);
    }
  }

  throw new Error("SQUARE_SYNC_FAILED_VERSION_MISMATCH");
}

type SquareCatalogObjectNode = {
  id?: string;
  version?: number | string;
  item_data?: {
    variations?: SquareCatalogObjectNode[];
  };
  modifier_list_data?: {
    modifiers?: SquareCatalogObjectNode[];
  };
  [key: string]: unknown;
};

async function hydrateSquareObjectVersions(input: {
  accessToken?: string;
  objects: unknown[];
  squareCatalogGateway: SquareCatalogGateway;
}): Promise<unknown[]> {
  const existingObjectIds = Array.from(
    new Set(collectExistingSquareObjectIds(input.objects)),
  );

  if (existingObjectIds.length === 0) {
    return input.objects;
  }

  const versionsById = new Map<string, number | string>();

  for (const objectIds of chunkValues(existingObjectIds, 900)) {
    const retrieved = await input.squareCatalogGateway.batchRetrieveCatalogObjects({
      accessToken: input.accessToken,
      includeRelatedObjects: true,
      objectIds,
    });

    for (const object of [...retrieved.objects, ...retrieved.relatedObjects]) {
      collectRetrievedSquareObjectVersions(object, versionsById);
    }
  }

  if (versionsById.size === 0) {
    return input.objects;
  }

  return input.objects.map((object) =>
    applySquareVersionsToObjectTree(object, versionsById),
  );
}

async function syncSquareProductImages(input: {
  accessToken?: string;
  productImages: Array<{
    imageUrls: Array<{
      name: string;
      url: string;
    }>;
    productId: string;
    productName: string;
    requestObjectId: string;
    squareItemId: string | null;
  }>;
  result: {
    idMappings: Array<{
      clientObjectId: string | null;
      objectId: string | null;
    }>;
  };
  squareCatalogGateway: SquareCatalogGateway;
  trackedEntities: SquareTrackedEntity[];
}): Promise<void> {
  if (input.productImages.length === 0) {
    return;
  }

  const resolvedSquareItemIds = new Map<string, string>();

  for (const entity of input.trackedEntities) {
    if (entity.entityType !== "PRODUCT_ITEM") {
      continue;
    }

    const resolved =
      input.result.idMappings.find(
        (mapping) => mapping.clientObjectId === entity.requestObjectId,
      )?.objectId ??
      (entity.requestObjectId.startsWith("#") ? null : entity.requestObjectId);

    if (resolved?.trim()) {
      resolvedSquareItemIds.set(entity.productId, resolved.trim());
    }
  }

  for (const product of input.productImages) {
    const objectId =
      resolvedSquareItemIds.get(product.productId) ?? product.squareItemId?.trim() ?? null;

    if (!objectId) {
      continue;
    }

    for (const [index, image] of product.imageUrls.entries()) {
      const imageUrl = image.url.trim();
      if (!imageUrl) {
        continue;
      }

      await input.squareCatalogGateway.createCatalogImageFromUrl({
        accessToken: input.accessToken,
        objectId,
        imageUrl,
        imageName: image.name || product.productName,
        caption: product.productName,
        isPrimary: index === 0,
      });
    }
  }
}

function collectExistingSquareObjectIds(objects: unknown[]): string[] {
  const objectIds: string[] = [];

  for (const object of objects) {
    collectExistingSquareObjectIdsFromNode(object, objectIds);
  }

  return objectIds;
}

function collectExistingSquareObjectIdsFromNode(
  value: unknown,
  objectIds: string[],
): void {
  if (!isSquareCatalogObjectNode(value)) {
    return;
  }

  const objectId = value.id?.trim();
  if (objectId && !objectId.startsWith("#")) {
    objectIds.push(objectId);
  }

  for (const variation of value.item_data?.variations ?? []) {
    collectExistingSquareObjectIdsFromNode(variation, objectIds);
  }

  for (const modifier of value.modifier_list_data?.modifiers ?? []) {
    collectExistingSquareObjectIdsFromNode(modifier, objectIds);
  }
}

function collectRetrievedSquareObjectVersions(
  value: unknown,
  versionsById: Map<string, number | string>,
): void {
  if (!isSquareCatalogObjectNode(value)) {
    return;
  }

  const objectId = value.id?.trim();
  if (objectId && !objectId.startsWith("#") && value.version !== undefined) {
    versionsById.set(objectId, value.version);
  }

  for (const variation of value.item_data?.variations ?? []) {
    collectRetrievedSquareObjectVersions(variation, versionsById);
  }

  for (const modifier of value.modifier_list_data?.modifiers ?? []) {
    collectRetrievedSquareObjectVersions(modifier, versionsById);
  }
}

function applySquareVersionsToObjectTree(
  value: unknown,
  versionsById: Map<string, number | string>,
): unknown {
  if (!isSquareCatalogObjectNode(value)) {
    return value;
  }

  const nextValue: SquareCatalogObjectNode = {
    ...value,
  };

  const objectId = nextValue.id?.trim();
  if (objectId && !objectId.startsWith("#")) {
    const latestVersion = versionsById.get(objectId);
    if (latestVersion !== undefined) {
      nextValue.version = latestVersion;
    }
  }

  if (Array.isArray(nextValue.item_data?.variations)) {
    nextValue.item_data = {
      ...nextValue.item_data,
      variations: nextValue.item_data.variations.map((variation) =>
        applySquareVersionsToObjectTree(variation, versionsById) as SquareCatalogObjectNode,
      ),
    };
  }

  if (Array.isArray(nextValue.modifier_list_data?.modifiers)) {
    nextValue.modifier_list_data = {
      ...nextValue.modifier_list_data,
      modifiers: nextValue.modifier_list_data.modifiers.map((modifier) =>
        applySquareVersionsToObjectTree(modifier, versionsById) as SquareCatalogObjectNode,
      ),
    };
  }

  return nextValue;
}

function resolveSquareEnvironment(): "PRODUCTION" | "SANDBOX" {
  const normalized = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return normalized === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}

function chunkValues<T>(values: T[], chunkSize: number): T[][] {
  if (values.length <= chunkSize) {
    return [values];
  }

  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

function isSquareVersionMismatchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toUpperCase();
  return (
    message.includes("VERSION_MISMATCH") ||
    message.includes("OBJECT VERSION DOES NOT MATCH LATEST DATABASE VERSION")
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isSquareCatalogObjectNode(value: unknown): value is SquareCatalogObjectNode {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
