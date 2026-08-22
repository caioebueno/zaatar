import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type {
  SquareCatalogSyncTaskRepository,
  SquareCatalogSyncTaskStatus,
  SquareCatalogSyncTaskType,
  SquareCatalogSyncTaskView,
} from "../../application/ports/SquareCatalogSyncTaskRepository.js";

type SquareCatalogSyncTaskRow = {
  attempts: number;
  availableAt: Date;
  businessId: string;
  createdAt: Date;
  errorMessage: string | null;
  finishedAt: Date | null;
  id: string;
  processingStartedAt: Date | null;
  productId: string;
  requestPayload: Prisma.JsonValue | null;
  responsePayload: Prisma.JsonValue | null;
  status: string;
  taskType: string;
  updatedAt: Date;
};

export class PrismaSquareCatalogSyncTaskRepository
  implements SquareCatalogSyncTaskRepository
{
  async createProductUpdateTask(input: {
    businessId: string;
    productId: string;
    requestPayload?: unknown;
  }): Promise<SquareCatalogSyncTaskView> {
    await prisma.$executeRaw`
      UPDATE "SquareCatalogSyncTask"
      SET
        "status" = 'SKIPPED'::"SquareCatalogSyncTaskStatus",
        "finishedAt" = now(),
        "errorMessage" = 'Superseded by a newer product update task',
        "updatedAt" = now()
      WHERE "businessId" = ${input.businessId}
        AND "productId" = ${input.productId}
        AND "taskType" = 'PRODUCT_UPDATE'::"SquareCatalogSyncTaskType"
        AND "status" IN ('PENDING', 'FAILED')
    `;

    const rows = await prisma.$queryRaw<SquareCatalogSyncTaskRow[]>`
      INSERT INTO "SquareCatalogSyncTask" (
        "id",
        "businessId",
        "productId",
        "taskType",
        "status",
        "attempts",
        "availableAt",
        "requestPayload",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        ${input.businessId},
        ${input.productId},
        'PRODUCT_UPDATE'::"SquareCatalogSyncTaskType",
        'PENDING'::"SquareCatalogSyncTaskStatus",
        0,
        now(),
        CAST(${JSON.stringify(input.requestPayload ?? null)} AS jsonb),
        now(),
        now()
      )
      RETURNING
        "id",
        "businessId",
        "productId",
        "taskType"::text AS "taskType",
        "status"::text AS "status",
        "attempts",
        "availableAt",
        "processingStartedAt",
        "finishedAt",
        "errorMessage",
        "requestPayload",
        "responsePayload",
        "createdAt",
        "updatedAt"
    `;

    return mapRow(rows[0]!);
  }

  async findById(input: {
    businessId: string;
    taskId: string;
  }): Promise<SquareCatalogSyncTaskView | null> {
    const rows = await prisma.$queryRaw<SquareCatalogSyncTaskRow[]>`
      SELECT
        "id",
        "businessId",
        "productId",
        "taskType"::text AS "taskType",
        "status"::text AS "status",
        "attempts",
        "availableAt",
        "processingStartedAt",
        "finishedAt",
        "errorMessage",
        "requestPayload",
        "responsePayload",
        "createdAt",
        "updatedAt"
      FROM "SquareCatalogSyncTask"
      WHERE "businessId" = ${input.businessId}
        AND "id" = ${input.taskId}
      LIMIT 1
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async claimPendingTasks(limit: number): Promise<SquareCatalogSyncTaskView[]> {
    const normalizedLimit = Math.max(1, Math.min(100, Math.trunc(limit)));

    const rows = await prisma.$transaction(async (tx) =>
      tx.$queryRaw<SquareCatalogSyncTaskRow[]>`
        WITH candidate_tasks AS (
          SELECT "id"
          FROM "SquareCatalogSyncTask"
          WHERE "status" IN ('PENDING', 'FAILED')
            AND "availableAt" <= now()
          ORDER BY "createdAt" ASC
          LIMIT ${normalizedLimit}
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "SquareCatalogSyncTask" task
        SET
          "status" = 'PROCESSING'::"SquareCatalogSyncTaskStatus",
          "attempts" = task."attempts" + 1,
          "processingStartedAt" = now(),
          "finishedAt" = NULL,
          "errorMessage" = NULL,
          "updatedAt" = now()
        FROM candidate_tasks
        WHERE task."id" = candidate_tasks."id"
        RETURNING
          task."id",
          task."businessId",
          task."productId",
          task."taskType"::text AS "taskType",
          task."status"::text AS "status",
          task."attempts",
          task."availableAt",
          task."processingStartedAt",
          task."finishedAt",
          task."errorMessage",
          task."requestPayload",
          task."responsePayload",
          task."createdAt",
          task."updatedAt"
      `,
    );

    return rows.map(mapRow);
  }

  async findLatestForProducts(input: {
    businessId: string;
    productIds: string[];
  }): Promise<Map<string, SquareCatalogSyncTaskView>> {
    const normalizedProductIds = Array.from(
      new Set(input.productIds.map((productId) => productId.trim()).filter(Boolean)),
    );

    if (normalizedProductIds.length === 0) {
      return new Map();
    }

    const rows = await prisma.$queryRaw<SquareCatalogSyncTaskRow[]>`
      SELECT DISTINCT ON ("productId")
        "id",
        "businessId",
        "productId",
        "taskType"::text AS "taskType",
        "status"::text AS "status",
        "attempts",
        "availableAt",
        "processingStartedAt",
        "finishedAt",
        "errorMessage",
        "requestPayload",
        "responsePayload",
        "createdAt",
        "updatedAt"
      FROM "SquareCatalogSyncTask"
      WHERE "businessId" = ${input.businessId}
        AND "productId" IN (${Prisma.join(normalizedProductIds)})
      ORDER BY "productId" ASC, "createdAt" DESC
    `;

    return new Map(rows.map((row) => [row.productId, mapRow(row)]));
  }

  async listTasks(input: {
    businessId: string;
    limit: number;
    productId?: string;
  }): Promise<SquareCatalogSyncTaskView[]> {
    const normalizedLimit = Math.max(1, Math.min(100, Math.trunc(input.limit)));
    const normalizedProductId = input.productId?.trim();

    const rows = normalizedProductId
      ? await prisma.$queryRaw<SquareCatalogSyncTaskRow[]>`
          SELECT
            "id",
            "businessId",
            "productId",
            "taskType"::text AS "taskType",
            "status"::text AS "status",
            "attempts",
            "availableAt",
            "processingStartedAt",
            "finishedAt",
            "errorMessage",
            "requestPayload",
            "responsePayload",
            "createdAt",
            "updatedAt"
          FROM "SquareCatalogSyncTask"
          WHERE "businessId" = ${input.businessId}
            AND "productId" = ${normalizedProductId}
          ORDER BY "createdAt" DESC
          LIMIT ${normalizedLimit}
        `
      : await prisma.$queryRaw<SquareCatalogSyncTaskRow[]>`
          SELECT
            "id",
            "businessId",
            "productId",
            "taskType"::text AS "taskType",
            "status"::text AS "status",
            "attempts",
            "availableAt",
            "processingStartedAt",
            "finishedAt",
            "errorMessage",
            "requestPayload",
            "responsePayload",
            "createdAt",
            "updatedAt"
          FROM "SquareCatalogSyncTask"
          WHERE "businessId" = ${input.businessId}
          ORDER BY "createdAt" DESC
          LIMIT ${normalizedLimit}
        `;

    return rows.map(mapRow);
  }

  async markTaskCompleted(input: {
    responsePayload?: unknown;
    status?: Extract<SquareCatalogSyncTaskStatus, "SKIPPED" | "SUCCESS">;
    taskId: string;
  }): Promise<void> {
    const status = input.status ?? "SUCCESS";

    await prisma.$executeRaw`
      UPDATE "SquareCatalogSyncTask"
      SET
        "status" = CAST(${status} AS "SquareCatalogSyncTaskStatus"),
        "finishedAt" = now(),
        "errorMessage" = NULL,
        "responsePayload" = CAST(${JSON.stringify(input.responsePayload ?? null)} AS jsonb),
        "updatedAt" = now()
      WHERE "id" = ${input.taskId}
    `;
  }

  async markTaskFailed(input: {
    errorMessage: string;
    responsePayload?: unknown;
    retryAt?: Date;
    taskId: string;
  }): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "SquareCatalogSyncTask"
      SET
        "status" = 'FAILED'::"SquareCatalogSyncTaskStatus",
        "availableAt" = ${input.retryAt ?? new Date()},
        "finishedAt" = now(),
        "errorMessage" = ${input.errorMessage},
        "responsePayload" = CAST(${JSON.stringify(input.responsePayload ?? null)} AS jsonb),
        "updatedAt" = now()
      WHERE "id" = ${input.taskId}
    `;
  }
}

function mapRow(row: SquareCatalogSyncTaskRow): SquareCatalogSyncTaskView {
  return {
    id: row.id,
    businessId: row.businessId,
    productId: row.productId,
    taskType: normalizeTaskType(row.taskType),
    status: normalizeStatus(row.status),
    attempts: row.attempts,
    availableAt: row.availableAt,
    processingStartedAt: row.processingStartedAt,
    finishedAt: row.finishedAt,
    errorMessage: row.errorMessage,
    requestPayload: row.requestPayload,
    responsePayload: row.responsePayload,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeTaskType(value: string): SquareCatalogSyncTaskType {
  return value === "PRODUCT_UPDATE" ? "PRODUCT_UPDATE" : "PRODUCT_UPDATE";
}

function normalizeStatus(value: string): SquareCatalogSyncTaskStatus {
  if (
    value === "PENDING" ||
    value === "PROCESSING" ||
    value === "SUCCESS" ||
    value === "FAILED" ||
    value === "SKIPPED"
  ) {
    return value;
  }

  return "FAILED";
}
