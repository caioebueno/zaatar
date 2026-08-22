import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type { SquareCatalogGateway } from "../ports/SquareCatalogGateway.js";
import {
  clearStoredSquareCatalogMappings,
  loadSquareCatalogMappingCounts,
} from "./ClearSquareCatalogMappingsUseCase.js";

type SquareCatalogObjectLike = {
  id?: string;
  type?: string;
  is_archived?: boolean;
};

type ArchiveSquareCatalogTestDataInput = {
  dryRun?: boolean;
};

export type ArchiveSquareCatalogTestDataOutput = {
  counts: {
    itemIds: number;
    menuIds: number;
    menuCategoryIds: number;
    modifierGroupIds: number;
    modifierItemIds: number;
    productIds: number;
  };
  dryRun: boolean;
  environment: "PRODUCTION" | "SANDBOX";
  success: boolean;
};

export class ArchiveSquareCatalogTestDataUseCase {
  constructor(private readonly squareCatalogGateway: SquareCatalogGateway) {}

  async execute(
    input: ArchiveSquareCatalogTestDataInput = {},
  ): Promise<ArchiveSquareCatalogTestDataOutput> {
    const counts = await loadCleanupCounts();
    const itemIds = await loadSquareItemIds();
    const environment = resolveSquareEnvironment();

    if (input.dryRun) {
      return {
        success: true,
        dryRun: true,
        environment,
        counts,
      };
    }

    for (const batch of chunkIds(itemIds, 1_000)) {
      if (batch.length === 0) {
        continue;
      }

      const retrieved = await this.squareCatalogGateway.batchRetrieveCatalogObjects({
        objectIds: batch,
        includeRelatedObjects: false,
      });

      const archivedObjects = retrieved.objects
        .filter(isCatalogItemObject)
        .map((object) => ({
          ...object,
          is_archived: true,
        }));

      if (archivedObjects.length === 0) {
        continue;
      }

      await this.squareCatalogGateway.batchUpsertCatalogObjects({
        idempotencyKey: randomUUID(),
        objects: archivedObjects,
      });
    }

    await clearStoredSquareCatalogMappings();

    return {
      success: true,
      dryRun: false,
      environment,
      counts,
    };
  }
}

async function loadSquareItemIds(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: {
      squareItemId: {
        not: null,
      },
    },
    select: {
      squareItemId: true,
    },
  });

  return dedupeIds(products.map((product) => product.squareItemId));
}

async function loadCleanupCounts(): Promise<ArchiveSquareCatalogTestDataOutput["counts"]> {
  const [mappingCounts, modifierItems] = await Promise.all([
    loadSquareCatalogMappingCounts(),
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
    itemIds: await prisma.product.count({
      where: {
        squareItemId: {
          not: null,
        },
      },
    }),
    menuIds: mappingCounts.menus,
    menuCategoryIds: mappingCounts.menuCategories,
    productIds: mappingCounts.products,
    modifierGroupIds: mappingCounts.modifierGroups,
    modifierItemIds: modifierItems,
  };
}

function isCatalogItemObject(value: unknown): value is SquareCatalogObjectLike {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return record.type === "ITEM" && typeof record.id === "string";
}

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }

  return chunks;
}

function dedupeIds(ids: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const id of ids) {
    const normalized = id?.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function resolveSquareEnvironment(): "PRODUCTION" | "SANDBOX" {
  const normalized = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return normalized === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}
