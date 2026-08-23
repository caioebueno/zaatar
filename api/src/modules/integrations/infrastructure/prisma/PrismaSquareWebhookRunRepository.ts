import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type {
  SquareWebhookRunAttemptView,
  SquareWebhookRunRepository,
  SquareWebhookRunStatus,
  SquareWebhookRunView,
} from "../../application/ports/SquareWebhookRunRepository.js";

type SquareWebhookRunRow = {
  action: string | null;
  attemptsCount: number;
  businessId: string | null;
  createdAt: Date;
  errorMessage: string | null;
  eventId: string | null;
  eventType: string | null;
  firstReceivedAt: Date;
  foodyOrderId: string | null;
  httpStatusCode: number | null;
  id: string;
  lastReceivedAt: Date;
  locationId: string | null;
  merchantId: string | null;
  processedAt: Date | null;
  processingDurationMs: number | null;
  reason: string | null;
  responsePayload: Prisma.JsonValue | null;
  signatureVerified: boolean | null;
  squareOrderId: string | null;
  squareOrderPayload: Prisma.JsonValue | null;
  squareOrderState: string | null;
  status: string;
  updatedAt: Date;
  webhookPayload: Prisma.JsonValue | null;
};

type SquareWebhookRunAttemptRow = {
  action: string | null;
  attemptNumber: number;
  createdAt: Date;
  errorMessage: string | null;
  finishedAt: Date | null;
  httpStatusCode: number | null;
  id: string;
  processingDurationMs: number | null;
  reason: string | null;
  receivedAt: Date;
  requestHeaders: Prisma.JsonValue | null;
  responsePayload: Prisma.JsonValue | null;
  runId: string;
  signatureVerified: boolean | null;
  squareOrderPayload: Prisma.JsonValue | null;
  status: string;
  webhookPayload: Prisma.JsonValue | null;
};

const TERMINAL_DUPLICATE_SKIP_STATUSES = new Set<SquareWebhookRunStatus>([
  "SUCCESS",
  "IGNORED",
  "DUPLICATE_SKIPPED",
]);

export class PrismaSquareWebhookRunRepository
  implements SquareWebhookRunRepository
{
  async beginAttempt(input: {
    businessId?: string | null;
    eventId?: string | null;
    eventType?: string | null;
    locationId?: string | null;
    merchantId?: string | null;
    requestHeaders?: unknown;
    signatureVerified?: boolean | null;
    squareOrderId?: string | null;
    squareOrderState?: string | null;
    webhookPayload?: unknown;
  }): Promise<{
    attempt: SquareWebhookRunAttemptView;
    run: SquareWebhookRunView;
    shouldSkipProcessing: boolean;
  }> {
    const normalizedEventId = input.eventId?.trim() ?? null;
    const normalizedEventType = input.eventType?.trim() ?? null;
    const normalizedLocationId = input.locationId?.trim() ?? null;
    const normalizedMerchantId = input.merchantId?.trim() ?? null;
    const normalizedSquareOrderId = input.squareOrderId?.trim() ?? null;
    const normalizedSquareOrderState = input.squareOrderState?.trim() ?? null;
    const normalizedBusinessId = input.businessId?.trim() ?? null;
    const signatureVerified =
      typeof input.signatureVerified === "boolean" ? input.signatureVerified : null;
    const webhookPayloadJson = JSON.stringify(input.webhookPayload ?? null);
    const requestHeadersJson = JSON.stringify(input.requestHeaders ?? null);

    return prisma.$transaction(async (tx) => {
      let existingRun: SquareWebhookRunRow | null = null;

      if (normalizedEventId) {
        const existingRows = await tx.$queryRaw<SquareWebhookRunRow[]>`
          SELECT
            "id",
            "businessId",
            "eventId",
            "eventType",
            "merchantId",
            "squareOrderId",
            "locationId",
            "squareOrderState",
            "signatureVerified",
            "status"::text AS "status",
            "action",
            "reason",
            "foodyOrderId",
            "firstReceivedAt",
            "lastReceivedAt",
            "processedAt",
            "processingDurationMs",
            "attemptsCount",
            "httpStatusCode",
            "errorMessage",
            "webhookPayload",
            "squareOrderPayload",
            "responsePayload",
            "createdAt",
            "updatedAt"
          FROM "SquareWebhookRun"
          WHERE "eventId" = ${normalizedEventId}
          LIMIT 1
        `;

        existingRun = existingRows[0] ?? null;
      }

      const shouldSkipProcessing =
        existingRun !== null &&
        TERMINAL_DUPLICATE_SKIP_STATUSES.has(normalizeStatus(existingRun.status));

      const nextAttemptNumber = (existingRun?.attemptsCount ?? 0) + 1;
      const runId = existingRun?.id ?? randomUUID();

      if (existingRun) {
        const runRows = await tx.$queryRaw<SquareWebhookRunRow[]>`
          UPDATE "SquareWebhookRun"
          SET
            "businessId" = COALESCE("businessId", ${normalizedBusinessId}),
            "eventType" = COALESCE(${normalizedEventType}, "eventType"),
            "merchantId" = COALESCE(${normalizedMerchantId}, "merchantId"),
            "squareOrderId" = COALESCE(${normalizedSquareOrderId}, "squareOrderId"),
            "locationId" = COALESCE(${normalizedLocationId}, "locationId"),
            "squareOrderState" = COALESCE(${normalizedSquareOrderState}, "squareOrderState"),
            "signatureVerified" = COALESCE(${signatureVerified}, "signatureVerified"),
            "status" = 'PROCESSING'::"SquareWebhookRunStatus",
            "lastReceivedAt" = now(),
            "processedAt" = NULL,
            "processingDurationMs" = NULL,
            "attemptsCount" = ${nextAttemptNumber},
            "httpStatusCode" = NULL,
            "errorMessage" = NULL,
            "webhookPayload" = CAST(${webhookPayloadJson} AS jsonb),
            "updatedAt" = now()
          WHERE "id" = ${runId}
          RETURNING
            "id",
            "businessId",
            "eventId",
            "eventType",
            "merchantId",
            "squareOrderId",
            "locationId",
            "squareOrderState",
            "signatureVerified",
            "status"::text AS "status",
            "action",
            "reason",
            "foodyOrderId",
            "firstReceivedAt",
            "lastReceivedAt",
            "processedAt",
            "processingDurationMs",
            "attemptsCount",
            "httpStatusCode",
            "errorMessage",
            "webhookPayload",
            "squareOrderPayload",
            "responsePayload",
            "createdAt",
            "updatedAt"
        `;

        existingRun = runRows[0] ?? existingRun;
      } else {
        const runRows = await tx.$queryRaw<SquareWebhookRunRow[]>`
          INSERT INTO "SquareWebhookRun" (
            "id",
            "businessId",
            "eventId",
            "eventType",
            "merchantId",
            "squareOrderId",
            "locationId",
            "squareOrderState",
            "signatureVerified",
            "status",
            "firstReceivedAt",
            "lastReceivedAt",
            "attemptsCount",
            "webhookPayload",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${runId},
            ${normalizedBusinessId},
            ${normalizedEventId},
            ${normalizedEventType},
            ${normalizedMerchantId},
            ${normalizedSquareOrderId},
            ${normalizedLocationId},
            ${normalizedSquareOrderState},
            ${signatureVerified},
            'PROCESSING'::"SquareWebhookRunStatus",
            now(),
            now(),
            1,
            CAST(${webhookPayloadJson} AS jsonb),
            now(),
            now()
          )
          RETURNING
            "id",
            "businessId",
            "eventId",
            "eventType",
            "merchantId",
            "squareOrderId",
            "locationId",
            "squareOrderState",
            "signatureVerified",
            "status"::text AS "status",
            "action",
            "reason",
            "foodyOrderId",
            "firstReceivedAt",
            "lastReceivedAt",
            "processedAt",
            "processingDurationMs",
            "attemptsCount",
            "httpStatusCode",
            "errorMessage",
            "webhookPayload",
            "squareOrderPayload",
            "responsePayload",
            "createdAt",
            "updatedAt"
        `;

        existingRun = runRows[0]!;
      }

      const attemptRows = await tx.$queryRaw<SquareWebhookRunAttemptRow[]>`
        INSERT INTO "SquareWebhookRunAttempt" (
          "id",
          "runId",
          "attemptNumber",
          "receivedAt",
          "status",
          "signatureVerified",
          "requestHeaders",
          "webhookPayload",
          "createdAt"
        )
        VALUES (
          ${randomUUID()},
          ${runId},
          ${nextAttemptNumber},
          now(),
          'PROCESSING'::"SquareWebhookRunStatus",
          ${signatureVerified},
          CAST(${requestHeadersJson} AS jsonb),
          CAST(${webhookPayloadJson} AS jsonb),
          now()
        )
        RETURNING
          "id",
          "runId",
          "attemptNumber",
          "receivedAt",
          "finishedAt",
          "processingDurationMs",
          "httpStatusCode",
          "status"::text AS "status",
          "action",
          "reason",
          "signatureVerified",
          "errorMessage",
          "requestHeaders",
          "webhookPayload",
          "squareOrderPayload",
          "responsePayload",
          "createdAt"
      `;

      return {
        run: mapRunRow(existingRun),
        attempt: mapAttemptRow(attemptRows[0]!),
        shouldSkipProcessing,
      };
    });
  }

  async completeAttempt(input: {
    action?: string | null;
    attemptId: string;
    errorMessage?: string | null;
    foodyOrderId?: string | null;
    httpStatusCode: number;
    reason?: string | null;
    responsePayload?: unknown;
    runId: string;
    signatureVerified?: boolean | null;
    squareOrderPayload?: unknown;
    status: SquareWebhookRunStatus;
  }): Promise<void> {
    const responsePayloadJson = JSON.stringify(input.responsePayload ?? null);
    const squareOrderPayloadJson = JSON.stringify(input.squareOrderPayload ?? null);
    const signatureVerified =
      typeof input.signatureVerified === "boolean" ? input.signatureVerified : null;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "SquareWebhookRunAttempt"
        SET
          "finishedAt" = now(),
          "processingDurationMs" = GREATEST(
            0,
            CAST(EXTRACT(EPOCH FROM (now() - "receivedAt")) * 1000 AS integer)
          ),
          "httpStatusCode" = ${input.httpStatusCode},
          "status" = CAST(${input.status} AS "SquareWebhookRunStatus"),
          "action" = ${input.action ?? null},
          "reason" = ${input.reason ?? null},
          "signatureVerified" = COALESCE(${signatureVerified}, "signatureVerified"),
          "errorMessage" = ${input.errorMessage ?? null},
          "squareOrderPayload" = CAST(${squareOrderPayloadJson} AS jsonb),
          "responsePayload" = CAST(${responsePayloadJson} AS jsonb)
        WHERE "id" = ${input.attemptId}
      `;

      await tx.$executeRaw`
        UPDATE "SquareWebhookRun"
        SET
          "status" = CAST(${input.status} AS "SquareWebhookRunStatus"),
          "action" = ${input.action ?? null},
          "reason" = ${input.reason ?? null},
          "foodyOrderId" = ${input.foodyOrderId ?? null},
          "processedAt" = now(),
          "processingDurationMs" = GREATEST(
            0,
            CAST(EXTRACT(EPOCH FROM (now() - "lastReceivedAt")) * 1000 AS integer)
          ),
          "httpStatusCode" = ${input.httpStatusCode},
          "signatureVerified" = COALESCE(${signatureVerified}, "signatureVerified"),
          "errorMessage" = ${input.errorMessage ?? null},
          "squareOrderPayload" = CAST(${squareOrderPayloadJson} AS jsonb),
          "responsePayload" = CAST(${responsePayloadJson} AS jsonb),
          "updatedAt" = now()
        WHERE "id" = ${input.runId}
      `;
    });
  }

  async findById(input: {
    businessId: string;
    runId: string;
  }): Promise<SquareWebhookRunView | null> {
    const runRows = await prisma.$queryRaw<SquareWebhookRunRow[]>`
      SELECT
        "id",
        "businessId",
        "eventId",
        "eventType",
        "merchantId",
        "squareOrderId",
        "locationId",
        "squareOrderState",
        "signatureVerified",
        "status"::text AS "status",
        "action",
        "reason",
        "foodyOrderId",
        "firstReceivedAt",
        "lastReceivedAt",
        "processedAt",
        "processingDurationMs",
        "attemptsCount",
        "httpStatusCode",
        "errorMessage",
        "webhookPayload",
        "squareOrderPayload",
        "responsePayload",
        "createdAt",
        "updatedAt"
      FROM "SquareWebhookRun"
      WHERE "businessId" = ${input.businessId}
        AND "id" = ${input.runId}
      LIMIT 1
    `;

    const run = runRows[0];
    if (!run) {
      return null;
    }

    const attemptRows = await prisma.$queryRaw<SquareWebhookRunAttemptRow[]>`
      SELECT
        "id",
        "runId",
        "attemptNumber",
        "receivedAt",
        "finishedAt",
        "processingDurationMs",
        "httpStatusCode",
        "status"::text AS "status",
        "action",
        "reason",
        "signatureVerified",
        "errorMessage",
        "requestHeaders",
        "webhookPayload",
        "squareOrderPayload",
        "responsePayload",
        "createdAt"
      FROM "SquareWebhookRunAttempt"
      WHERE "runId" = ${run.id}
      ORDER BY "attemptNumber" ASC
    `;

    return {
      ...mapRunRow(run),
      attempts: attemptRows.map(mapAttemptRow),
    };
  }

  async listRuns(input: {
    businessId: string;
    eventType?: string;
    limit: number;
    status?: SquareWebhookRunStatus;
  }): Promise<SquareWebhookRunView[]> {
    const normalizedLimit = Math.max(1, Math.min(100, Math.trunc(input.limit)));
    const normalizedEventType = input.eventType?.trim();

    const rows =
      normalizedEventType && input.status
        ? await prisma.$queryRaw<SquareWebhookRunRow[]>`
            SELECT
              "id",
              "businessId",
              "eventId",
              "eventType",
              "merchantId",
              "squareOrderId",
              "locationId",
              "squareOrderState",
              "signatureVerified",
              "status"::text AS "status",
              "action",
              "reason",
              "foodyOrderId",
              "firstReceivedAt",
              "lastReceivedAt",
              "processedAt",
              "processingDurationMs",
              "attemptsCount",
              "httpStatusCode",
              "errorMessage",
              "webhookPayload",
              "squareOrderPayload",
              "responsePayload",
              "createdAt",
              "updatedAt"
            FROM "SquareWebhookRun"
            WHERE "businessId" = ${input.businessId}
              AND "eventType" = ${normalizedEventType}
              AND "status" = CAST(${input.status} AS "SquareWebhookRunStatus")
            ORDER BY "lastReceivedAt" DESC
            LIMIT ${normalizedLimit}
          `
        : normalizedEventType
          ? await prisma.$queryRaw<SquareWebhookRunRow[]>`
              SELECT
                "id",
                "businessId",
                "eventId",
                "eventType",
                "merchantId",
                "squareOrderId",
                "locationId",
                "squareOrderState",
                "signatureVerified",
                "status"::text AS "status",
                "action",
                "reason",
                "foodyOrderId",
                "firstReceivedAt",
                "lastReceivedAt",
                "processedAt",
                "processingDurationMs",
                "attemptsCount",
                "httpStatusCode",
                "errorMessage",
                "webhookPayload",
                "squareOrderPayload",
                "responsePayload",
                "createdAt",
                "updatedAt"
              FROM "SquareWebhookRun"
              WHERE "businessId" = ${input.businessId}
                AND "eventType" = ${normalizedEventType}
              ORDER BY "lastReceivedAt" DESC
              LIMIT ${normalizedLimit}
            `
          : input.status
            ? await prisma.$queryRaw<SquareWebhookRunRow[]>`
                SELECT
                  "id",
                  "businessId",
                  "eventId",
                  "eventType",
                  "merchantId",
                  "squareOrderId",
                  "locationId",
                  "squareOrderState",
                  "signatureVerified",
                  "status"::text AS "status",
                  "action",
                  "reason",
                  "foodyOrderId",
                  "firstReceivedAt",
                  "lastReceivedAt",
                  "processedAt",
                  "processingDurationMs",
                  "attemptsCount",
                  "httpStatusCode",
                  "errorMessage",
                  "webhookPayload",
                  "squareOrderPayload",
                  "responsePayload",
                  "createdAt",
                  "updatedAt"
                FROM "SquareWebhookRun"
                WHERE "businessId" = ${input.businessId}
                  AND "status" = CAST(${input.status} AS "SquareWebhookRunStatus")
                ORDER BY "lastReceivedAt" DESC
                LIMIT ${normalizedLimit}
              `
            : await prisma.$queryRaw<SquareWebhookRunRow[]>`
                SELECT
                  "id",
                  "businessId",
                  "eventId",
                  "eventType",
                  "merchantId",
                  "squareOrderId",
                  "locationId",
                  "squareOrderState",
                  "signatureVerified",
                  "status"::text AS "status",
                  "action",
                  "reason",
                  "foodyOrderId",
                  "firstReceivedAt",
                  "lastReceivedAt",
                  "processedAt",
                  "processingDurationMs",
                  "attemptsCount",
                  "httpStatusCode",
                  "errorMessage",
                  "webhookPayload",
                  "squareOrderPayload",
                  "responsePayload",
                  "createdAt",
                  "updatedAt"
                FROM "SquareWebhookRun"
                WHERE "businessId" = ${input.businessId}
                ORDER BY "lastReceivedAt" DESC
                LIMIT ${normalizedLimit}
              `;

    return rows.map(mapRunRow);
  }
}

function mapRunRow(row: SquareWebhookRunRow): SquareWebhookRunView {
  return {
    id: row.id,
    businessId: row.businessId,
    eventId: row.eventId,
    eventType: row.eventType,
    merchantId: row.merchantId,
    squareOrderId: row.squareOrderId,
    locationId: row.locationId,
    squareOrderState: row.squareOrderState,
    signatureVerified: row.signatureVerified,
    status: normalizeStatus(row.status),
    action: row.action,
    reason: row.reason,
    foodyOrderId: row.foodyOrderId,
    firstReceivedAt: row.firstReceivedAt,
    lastReceivedAt: row.lastReceivedAt,
    processedAt: row.processedAt,
    processingDurationMs: row.processingDurationMs,
    attemptsCount: row.attemptsCount,
    httpStatusCode: row.httpStatusCode,
    errorMessage: row.errorMessage,
    webhookPayload: row.webhookPayload,
    squareOrderPayload: row.squareOrderPayload,
    responsePayload: row.responsePayload,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapAttemptRow(row: SquareWebhookRunAttemptRow): SquareWebhookRunAttemptView {
  return {
    id: row.id,
    runId: row.runId,
    attemptNumber: row.attemptNumber,
    receivedAt: row.receivedAt,
    finishedAt: row.finishedAt,
    processingDurationMs: row.processingDurationMs,
    httpStatusCode: row.httpStatusCode,
    status: normalizeStatus(row.status),
    action: row.action,
    reason: row.reason,
    signatureVerified: row.signatureVerified,
    errorMessage: row.errorMessage,
    requestHeaders: row.requestHeaders,
    webhookPayload: row.webhookPayload,
    squareOrderPayload: row.squareOrderPayload,
    responsePayload: row.responsePayload,
    createdAt: row.createdAt,
  };
}

function normalizeStatus(value: string): SquareWebhookRunStatus {
  switch (value) {
    case "SUCCESS":
    case "FAILED":
    case "IGNORED":
    case "DUPLICATE_SKIPPED":
      return value;
    default:
      return "PROCESSING";
  }
}
