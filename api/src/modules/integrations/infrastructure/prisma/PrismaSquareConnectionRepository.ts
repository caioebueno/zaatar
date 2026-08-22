import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import type {
  SaveSquareConnectionInput,
  SquareConnectionEnvironment,
  SquareConnectionRepository,
  SquareConnectionView,
} from "../../application/ports/SquareConnectionRepository.js";

type SquareConnectionRow = {
  accessToken?: string;
  businessId: string;
  connectedAt: Date;
  environment: string;
  expiresAt: Date | null;
  id: string;
  merchantId: string | null;
  rawPayload?: unknown;
  refreshToken?: string | null;
  scope: string | null;
  tokenType?: string | null;
  updatedAt: Date;
  userId: string;
};

export class PrismaSquareConnectionRepository
  implements SquareConnectionRepository
{
  async deleteByBusinessId(businessId: string): Promise<boolean> {
    try {
      await prisma.$executeRaw`
        DELETE FROM "SquareConnection"
        WHERE "businessId" = ${businessId}
      `;
      return true;
    } catch {
      return false;
    }
  }

  async findByBusinessId(businessId: string): Promise<SquareConnectionView | null> {
    const rows = await prisma.$queryRaw<SquareConnectionRow[]>`
      SELECT
        "id",
        "userId",
        "businessId",
        "merchantId",
        "environment"::text AS "environment",
        "accessToken",
        "refreshToken",
        "scope",
        "tokenType",
        "expiresAt",
        "connectedAt",
        "updatedAt",
        "rawPayload"
      FROM "SquareConnection"
      WHERE "businessId" = ${businessId}
      LIMIT 1
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByBusinessIdWithSecrets(
    businessId: string,
  ): Promise<SquareConnectionView | null> {
    const rows = await prisma.$queryRaw<SquareConnectionRow[]>`
      SELECT
        "id",
        "userId",
        "businessId",
        "merchantId",
        "environment"::text AS "environment",
        "accessToken",
        "refreshToken",
        "scope",
        "tokenType",
        "expiresAt",
        "connectedAt",
        "updatedAt",
        "rawPayload"
      FROM "SquareConnection"
      WHERE "businessId" = ${businessId}
      LIMIT 1
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByMerchantIdWithSecrets(
    merchantId: string,
  ): Promise<SquareConnectionView | null> {
    const rows = await prisma.$queryRaw<SquareConnectionRow[]>`
      SELECT
        "id",
        "userId",
        "businessId",
        "merchantId",
        "environment"::text AS "environment",
        "accessToken",
        "refreshToken",
        "scope",
        "tokenType",
        "expiresAt",
        "connectedAt",
        "updatedAt",
        "rawPayload"
      FROM "SquareConnection"
      WHERE "merchantId" = ${merchantId}
      LIMIT 1
    `;

    return rows[0] ? mapRow(rows[0]) : null;
  }

  async save(input: SaveSquareConnectionInput): Promise<SquareConnectionView> {
    const rawPayloadJson = JSON.stringify(input.rawPayload ?? null);
    const rows = await prisma.$queryRaw<SquareConnectionRow[]>`
      INSERT INTO "SquareConnection" (
        "id",
        "userId",
        "businessId",
        "merchantId",
        "environment",
        "accessToken",
        "refreshToken",
        "scope",
        "tokenType",
        "expiresAt",
        "connectedAt",
        "createdAt",
        "updatedAt",
        "rawPayload"
      )
      VALUES (
        ${randomUUID()},
        ${input.userId},
        ${input.businessId},
        ${input.merchantId},
        CAST(${input.environment} AS "ExternalIntegrationEnvironment"),
        ${input.accessToken},
        ${input.refreshToken},
        ${input.scope},
        ${input.tokenType},
        ${input.expiresAt},
        now(),
        now(),
        now(),
        CAST(${rawPayloadJson} AS jsonb)
      )
      ON CONFLICT ("businessId")
      DO UPDATE SET
        "userId" = EXCLUDED."userId",
        "merchantId" = EXCLUDED."merchantId",
        "environment" = EXCLUDED."environment",
        "accessToken" = EXCLUDED."accessToken",
        "refreshToken" = EXCLUDED."refreshToken",
        "scope" = EXCLUDED."scope",
        "tokenType" = EXCLUDED."tokenType",
        "expiresAt" = EXCLUDED."expiresAt",
        "rawPayload" = EXCLUDED."rawPayload",
        "updatedAt" = now()
      RETURNING
        "id",
        "userId",
        "businessId",
        "merchantId",
        "environment"::text AS "environment",
        "accessToken",
        "refreshToken",
        "scope",
        "tokenType",
        "expiresAt",
        "connectedAt",
        "updatedAt",
        "rawPayload"
    `;

    return mapRow(rows[0]!);
  }
}

export function resolveSquareConnectionEnvironment(): SquareConnectionEnvironment {
  const configured = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return configured === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}

function mapRow(row: SquareConnectionRow): SquareConnectionView {
  return {
    id: row.id,
    userId: row.userId,
    businessId: row.businessId,
    merchantId: row.merchantId ?? null,
    environment:
      row.environment === "PRODUCTION" ? "PRODUCTION" : "SANDBOX",
    scope: row.scope,
    tokenType: row.tokenType ?? null,
    rawPayload: row.rawPayload,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken ?? null,
    expiresAt: row.expiresAt,
    connectedAt: row.connectedAt,
    updatedAt: row.updatedAt,
  };
}
