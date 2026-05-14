import prisma from "../../../../prisma.js";
import type {
  ExternalIntegrationEnvironment,
  SaveUberEatsConnectionInput,
  UberEatsConnectionRepository,
  UberEatsConnectionView,
} from "../../application/ports/UberEatsConnectionRepository.js";

type UberEatsConnectionRow = {
  accessToken?: string;
  businessId?: string | null;
  connectionId?: string;
  connectedAt: Date;
  environment: string;
  expiresAt: Date | null;
  id: string;
  rawPayload?: unknown;
  refreshToken?: string | null;
  scope: string | null;
  tokenType?: string | null;
  updatedAt: Date;
};

const PROVIDER = "UBER_EATS" as const;

export class PrismaUberEatsConnectionRepository
  implements UberEatsConnectionRepository
{
  async findForUserWithSecrets(userId: string): Promise<UberEatsConnectionView | null> {
    const rows = await prisma.$queryRaw<UberEatsConnectionRow[]>`
      SELECT
        "id",
        "id" AS "connectionId",
        "businessId",
        "environment"::text AS "environment",
        "scope",
        "tokenType",
        "accessToken",
        "refreshToken",
        "rawPayload",
        "expiresAt",
        "connectedAt",
        "updatedAt"
      FROM "ExternalIntegrationConnection"
      WHERE "provider" = CAST(${PROVIDER} AS "ExternalIntegrationProvider")
        AND "userId" = ${userId}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) return null;
    return mapRow(row);
  }

  async findForUser(userId: string): Promise<UberEatsConnectionView | null> {
    const rows = await prisma.$queryRaw<UberEatsConnectionRow[]>`
      SELECT
        "id",
        "id" AS "connectionId",
        "businessId",
        "environment"::text AS "environment",
        "scope",
        "tokenType",
        "rawPayload",
        "expiresAt",
        "connectedAt",
        "updatedAt"
      FROM "ExternalIntegrationConnection"
      WHERE "provider" = CAST(${PROVIDER} AS "ExternalIntegrationProvider")
        AND "userId" = ${userId}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) return null;

    return mapRow(row);
  }

  async save(input: SaveUberEatsConnectionInput): Promise<UberEatsConnectionView> {
    const businessOwnerRows = await prisma.$queryRaw<{ businessId: string }[]>`
      SELECT "businessId"
      FROM "BusinessOwner"
      WHERE "userId" = ${input.userId}
      LIMIT 1
    `;
    const defaultBusinessId = businessOwnerRows[0]?.businessId ?? null;
    const businessId = input.businessId ?? defaultBusinessId;
    const rawPayloadJson = JSON.stringify(input.rawPayload ?? null);

    const rows = await prisma.$queryRaw<UberEatsConnectionRow[]>`
      INSERT INTO "ExternalIntegrationConnection" (
        "id",
        "provider",
        "environment",
        "userId",
        "businessId",
        "accessToken",
        "refreshToken",
        "scope",
        "tokenType",
        "expiresAt",
        "rawPayload",
        "connectedAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        CAST(${PROVIDER} AS "ExternalIntegrationProvider"),
        CAST(${input.environment} AS "ExternalIntegrationEnvironment"),
        ${input.userId},
        ${businessId},
        ${input.accessToken},
        ${input.refreshToken},
        ${input.scope},
        ${input.tokenType},
        ${input.expiresAt},
        CAST(${rawPayloadJson} AS jsonb),
        now(),
        now(),
        now()
      )
      ON CONFLICT ("provider", "userId")
      DO UPDATE SET
        "environment" = EXCLUDED."environment",
        "businessId" = EXCLUDED."businessId",
        "accessToken" = EXCLUDED."accessToken",
        "refreshToken" = EXCLUDED."refreshToken",
        "scope" = EXCLUDED."scope",
        "tokenType" = EXCLUDED."tokenType",
        "expiresAt" = EXCLUDED."expiresAt",
        "rawPayload" = EXCLUDED."rawPayload",
        "updatedAt" = now()
      RETURNING
        "id",
        "environment"::text AS "environment",
        "scope",
        "rawPayload",
        "expiresAt",
        "connectedAt",
        "updatedAt"
    `;

    return mapRow(rows[0]);
  }
}

function mapRow(row: UberEatsConnectionRow): UberEatsConnectionView {
  return {
    id: row.id,
    connectionId: row.connectionId ?? row.id,
    businessId: row.businessId ?? null,
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

export function resolveIntegrationEnvironment(): ExternalIntegrationEnvironment {
  const baseUrl = process.env.UBER_EATS_OAUTH_BASE_URL?.trim().toLowerCase() ?? "";

  if (baseUrl.includes("sandbox")) {
    return "SANDBOX";
  }

  return "PRODUCTION";
}
