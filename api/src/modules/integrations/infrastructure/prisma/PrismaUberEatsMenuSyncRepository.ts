import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type {
  CreateMenuSyncRunInput,
  ExternalMenuEntityMapView,
  MenuSyncRunView,
  UberEatsMenuSyncRepository,
  UpdateMenuSyncRunInput,
  UpsertEntityMapInput,
} from "../../application/ports/UberEatsMenuSyncRepository.js";

type MenuSyncRunRow = {
  businessId: string | null;
  categoriesCount: number;
  connectionId: string | null;
  createdAt: Date;
  dryRun: boolean;
  errorMessage: string | null;
  finishedAt: Date | null;
  forced: boolean;
  id: string;
  itemsCount: number;
  menuId: string;
  modifierGroupsCount: number;
  modifierItemsCount: number;
  requestHash: string;
  startedAt: Date | null;
  status: string;
  storeId: string;
  updatedAt: Date;
  userId: string;
};

type EntityMapRow = {
  entityType: string;
  externalEntityId: string;
  internalEntityId: string;
  rawPayload: Prisma.JsonValue | null;
};

export class PrismaUberEatsMenuSyncRepository implements UberEatsMenuSyncRepository {
  async createRun(input: CreateMenuSyncRunInput): Promise<MenuSyncRunView> {
    const rows = await prisma.$queryRaw<MenuSyncRunRow[]>`
      INSERT INTO "ExternalMenuSyncRun" (
        "id",
        "provider",
        "status",
        "userId",
        "businessId",
        "menuId",
        "storeId",
        "dryRun",
        "forced",
        "requestHash",
        "categoriesCount",
        "itemsCount",
        "modifierGroupsCount",
        "modifierItemsCount",
        "startedAt",
        "requestPayload",
        "connectionId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        CAST(${input.provider} AS "ExternalIntegrationProvider"),
        CAST(${input.status} AS "ExternalMenuSyncStatus"),
        ${input.userId},
        ${input.businessId},
        ${input.menuId},
        ${input.storeId},
        ${input.dryRun},
        ${input.forced},
        ${input.requestHash},
        ${input.counts.categoriesCount},
        ${input.counts.itemsCount},
        ${input.counts.modifierGroupsCount},
        ${input.counts.modifierItemsCount},
        ${input.startedAt},
        CAST(${JSON.stringify(input.requestPayload ?? null)} AS jsonb),
        ${input.connectionId},
        now(),
        now()
      )
      RETURNING
        "id",
        "status"::text AS "status",
        "userId",
        "businessId",
        "menuId",
        "storeId",
        "dryRun",
        "forced",
        "requestHash",
        "categoriesCount",
        "itemsCount",
        "modifierGroupsCount",
        "modifierItemsCount",
        "startedAt",
        "finishedAt",
        "errorMessage",
        "connectionId",
        "createdAt",
        "updatedAt"
    `;

    return mapRunRow(rows[0]);
  }

  async updateRun(input: UpdateMenuSyncRunInput): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "ExternalMenuSyncRun"
      SET
        "status" = CAST(${input.status} AS "ExternalMenuSyncStatus"),
        "finishedAt" = ${input.finishedAt},
        "errorMessage" = ${input.errorMessage ?? null},
        "responsePayload" = CAST(${JSON.stringify(input.responsePayload ?? null)} AS jsonb),
        "updatedAt" = now()
      WHERE "id" = ${input.runId}
    `;
  }

  async findLatestForMenu(userId: string, menuId: string): Promise<MenuSyncRunView | null> {
    const rows = await prisma.$queryRaw<MenuSyncRunRow[]>`
      SELECT
        "id",
        "status"::text AS "status",
        "userId",
        "businessId",
        "menuId",
        "storeId",
        "dryRun",
        "forced",
        "requestHash",
        "categoriesCount",
        "itemsCount",
        "modifierGroupsCount",
        "modifierItemsCount",
        "startedAt",
        "finishedAt",
        "errorMessage",
        "connectionId",
        "createdAt",
        "updatedAt"
      FROM "ExternalMenuSyncRun"
      WHERE "provider" = CAST(${"UBER_EATS"} AS "ExternalIntegrationProvider")
        AND "userId" = ${userId}
        AND "menuId" = ${menuId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return rows[0] ? mapRunRow(rows[0]) : null;
  }

  async listEntityMaps(input: {
    entityType?: ExternalMenuEntityMapView["entityType"];
    menuId?: string;
    userId: string;
  }): Promise<ExternalMenuEntityMapView[]> {
    let rows: EntityMapRow[] = [];

    if (input.menuId && input.entityType) {
      rows = await prisma.$queryRaw<EntityMapRow[]>`
        SELECT
          "entityType"::text AS "entityType",
          "internalEntityId",
          "externalEntityId",
          "rawPayload"
        FROM "ExternalMenuEntityMap"
        WHERE "provider" = CAST(${"UBER_EATS"} AS "ExternalIntegrationProvider")
          AND "userId" = ${input.userId}
          AND "menuId" = ${input.menuId}
          AND "entityType" = CAST(${input.entityType} AS "ExternalMenuEntityType")
      `;
    } else if (input.menuId) {
      rows = await prisma.$queryRaw<EntityMapRow[]>`
        SELECT
          "entityType"::text AS "entityType",
          "internalEntityId",
          "externalEntityId",
          "rawPayload"
        FROM "ExternalMenuEntityMap"
        WHERE "provider" = CAST(${"UBER_EATS"} AS "ExternalIntegrationProvider")
          AND "userId" = ${input.userId}
          AND "menuId" = ${input.menuId}
      `;
    } else if (input.entityType) {
      rows = await prisma.$queryRaw<EntityMapRow[]>`
        SELECT
          "entityType"::text AS "entityType",
          "internalEntityId",
          "externalEntityId",
          "rawPayload"
        FROM "ExternalMenuEntityMap"
        WHERE "provider" = CAST(${"UBER_EATS"} AS "ExternalIntegrationProvider")
          AND "userId" = ${input.userId}
          AND "entityType" = CAST(${input.entityType} AS "ExternalMenuEntityType")
      `;
    } else {
      rows = await prisma.$queryRaw<EntityMapRow[]>`
        SELECT
          "entityType"::text AS "entityType",
          "internalEntityId",
          "externalEntityId",
          "rawPayload"
        FROM "ExternalMenuEntityMap"
        WHERE "provider" = CAST(${"UBER_EATS"} AS "ExternalIntegrationProvider")
          AND "userId" = ${input.userId}
      `;
    }

    return rows.map((row) => ({
      entityType: normalizeEntityType(row.entityType),
      internalEntityId: row.internalEntityId,
      externalEntityId: row.externalEntityId,
      rawPayload: row.rawPayload,
    }));
  }

  async listRuns(input: { limit: number; menuId?: string; userId: string }): Promise<MenuSyncRunView[]> {
    const limit = Math.max(1, Math.min(100, Math.trunc(input.limit)));

    const rows = input.menuId
      ? await prisma.$queryRaw<MenuSyncRunRow[]>`
          SELECT
            "id",
            "status"::text AS "status",
            "userId",
            "businessId",
            "menuId",
            "storeId",
            "dryRun",
            "forced",
            "requestHash",
            "categoriesCount",
            "itemsCount",
            "modifierGroupsCount",
            "modifierItemsCount",
            "startedAt",
            "finishedAt",
            "errorMessage",
            "connectionId",
            "createdAt",
            "updatedAt"
          FROM "ExternalMenuSyncRun"
          WHERE "provider" = CAST(${"UBER_EATS"} AS "ExternalIntegrationProvider")
            AND "userId" = ${input.userId}
            AND "menuId" = ${input.menuId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `
      : await prisma.$queryRaw<MenuSyncRunRow[]>`
          SELECT
            "id",
            "status"::text AS "status",
            "userId",
            "businessId",
            "menuId",
            "storeId",
            "dryRun",
            "forced",
            "requestHash",
            "categoriesCount",
            "itemsCount",
            "modifierGroupsCount",
            "modifierItemsCount",
            "startedAt",
            "finishedAt",
            "errorMessage",
            "connectionId",
            "createdAt",
            "updatedAt"
          FROM "ExternalMenuSyncRun"
          WHERE "provider" = CAST(${"UBER_EATS"} AS "ExternalIntegrationProvider")
            AND "userId" = ${input.userId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `;

    return rows.map(mapRunRow);
  }

  async upsertEntityMappings(rows: UpsertEntityMapInput[]): Promise<void> {
    if (rows.length === 0) return;

    await prisma.$transaction(
      rows.map((row) =>
        prisma.$executeRaw`
          INSERT INTO "ExternalMenuEntityMap" (
            "id",
            "provider",
            "userId",
            "businessId",
            "menuId",
            "entityType",
            "internalEntityId",
            "externalEntityId",
            "connectionId",
            "rawPayload",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${crypto.randomUUID()},
            CAST(${row.provider} AS "ExternalIntegrationProvider"),
            ${row.userId},
            ${row.businessId},
            ${row.menuId},
            CAST(${row.entityType} AS "ExternalMenuEntityType"),
            ${row.internalEntityId},
            ${row.externalEntityId},
            ${row.connectionId},
            CAST(${JSON.stringify(row.rawPayload ?? null)} AS jsonb),
            now(),
            now()
          )
          ON CONFLICT ("provider", "userId", "entityType", "internalEntityId")
          DO UPDATE SET
            "businessId" = EXCLUDED."businessId",
            "menuId" = EXCLUDED."menuId",
            "externalEntityId" = EXCLUDED."externalEntityId",
            "connectionId" = EXCLUDED."connectionId",
            "rawPayload" = EXCLUDED."rawPayload",
            "updatedAt" = now()
        `,
      ),
    );
  }
}

function mapRunRow(row: MenuSyncRunRow): MenuSyncRunView {
  return {
    id: row.id,
    status: normalizeStatus(row.status),
    userId: row.userId,
    businessId: row.businessId,
    menuId: row.menuId,
    storeId: row.storeId,
    dryRun: row.dryRun,
    forced: row.forced,
    requestHash: row.requestHash,
    counts: {
      categoriesCount: row.categoriesCount,
      itemsCount: row.itemsCount,
      modifierGroupsCount: row.modifierGroupsCount,
      modifierItemsCount: row.modifierItemsCount,
    },
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    errorMessage: row.errorMessage,
    connectionId: row.connectionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeStatus(value: string): MenuSyncRunView["status"] {
  if (value === "SUCCESS" || value === "FAILED" || value === "SKIPPED") {
    return value;
  }

  return "PENDING";
}

function normalizeEntityType(
  value: string,
): ExternalMenuEntityMapView["entityType"] {
  if (
    value === "MENU" ||
    value === "CATEGORY" ||
    value === "ITEM" ||
    value === "MODIFIER_GROUP" ||
    value === "MODIFIER_ITEM"
  ) {
    return value;
  }

  return "ITEM";
}
