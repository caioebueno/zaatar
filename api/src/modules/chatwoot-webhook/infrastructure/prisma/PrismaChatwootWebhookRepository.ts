import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type {
  ChatwootBusinessMatch,
  ChatwootWebhookRepository,
  RegisterOwnerIosPushTokenInput,
} from "../../application/ports/ChatwootWebhookRepository.js";

type BranchMatchRow = {
  branchId: string;
  businessId: string;
};

type TokenRow = {
  pushToken: string;
};

let pushDeviceTableEnsured = false;
let pushDeviceTablePromise: Promise<void> | null = null;

export class PrismaChatwootWebhookRepository implements ChatwootWebhookRepository {
  async findBusinessByChatwootAccount(input: {
    accountId?: string | null;
    sourceId?: string | null;
  }): Promise<ChatwootBusinessMatch | null> {
    const accountId = input.accountId?.trim() || null;
    const sourceId = input.sourceId?.trim() || null;

    if (!accountId && !sourceId) {
      return null;
    }

    if (accountId && sourceId) {
      const rows = await prisma.$queryRaw<BranchMatchRow[]>`
        SELECT
          b."id" AS "branchId",
          b."businessId" AS "businessId"
        FROM "Branch" b
        WHERE b."chatwootAccountId" = ${accountId}
          AND b."chatwootSourceId" = ${sourceId}
          AND b."businessId" IS NOT NULL
        ORDER BY b."createdAt" ASC
        LIMIT 1
      `;
      if (rows[0]) {
        return rows[0];
      }
    }

    if (accountId) {
      const rows = await prisma.$queryRaw<BranchMatchRow[]>`
        SELECT
          b."id" AS "branchId",
          b."businessId" AS "businessId"
        FROM "Branch" b
        WHERE b."chatwootAccountId" = ${accountId}
          AND b."businessId" IS NOT NULL
        ORDER BY b."createdAt" ASC
        LIMIT 1
      `;
      if (rows[0]) {
        return rows[0];
      }
    }

    if (!sourceId) {
      return null;
    }

    const sourceRows = await prisma.$queryRaw<BranchMatchRow[]>`
      SELECT
        b."id" AS "branchId",
        b."businessId" AS "businessId"
      FROM "Branch" b
      WHERE b."chatwootSourceId" = ${sourceId}
        AND b."businessId" IS NOT NULL
      ORDER BY b."createdAt" ASC
      LIMIT 1
    `;
    return sourceRows[0] ?? null;
  }

  async listOwnerIosPushTokensByBusinessId(businessId: string): Promise<string[]> {
    await ensurePushDeviceStorage();

    const rows = await prisma.$queryRaw<TokenRow[]>`
      SELECT DISTINCT d."pushToken" AS "pushToken"
      FROM "UserPushDevice" d
      INNER JOIN "BusinessOwner" bo
        ON bo."userId" = d."userId"
        AND bo."businessId" = ${businessId}
      WHERE d."businessId" = ${businessId}
        AND d."platform" = 'IOS'::"UserPushDevicePlatform"
        AND d."revokedAt" IS NULL
    `;

    return rows
      .map((row) => row.pushToken?.trim())
      .filter((token): token is string => Boolean(token));
  }

  async registerOwnerIosPushToken(
    input: RegisterOwnerIosPushTokenInput,
  ): Promise<void> {
    await ensurePushDeviceStorage();

    const now = new Date();

    // Revoke all other tokens for this user+business so old tokens (e.g. from
    // Expo Go) don't keep receiving notifications after switching to a native build.
    await prisma.$executeRaw`
      UPDATE "UserPushDevice"
      SET "revokedAt" = ${now}, "updatedAt" = ${now}
      WHERE "userId" = ${input.userId}
        AND "businessId" = ${input.businessId}
        AND "platform" = 'IOS'::"UserPushDevicePlatform"
        AND "pushToken" != ${input.pushToken}
        AND "revokedAt" IS NULL
    `;

    await prisma.$executeRaw`
      INSERT INTO "UserPushDevice" (
        "id",
        "createdAt",
        "updatedAt",
        "userId",
        "businessId",
        "platform",
        "pushToken",
        "lastSeenAt"
      )
      VALUES (
        ${randomUUID()},
        ${now},
        ${now},
        ${input.userId},
        ${input.businessId},
        'IOS'::"UserPushDevicePlatform",
        ${input.pushToken},
        ${now}
      )
      ON CONFLICT ("pushToken")
      DO UPDATE SET
        "userId" = EXCLUDED."userId",
        "businessId" = EXCLUDED."businessId",
        "platform" = EXCLUDED."platform",
        "updatedAt" = EXCLUDED."updatedAt",
        "lastSeenAt" = EXCLUDED."lastSeenAt",
        "revokedAt" = NULL
    `;
  }
}

async function ensurePushDeviceStorage(): Promise<void> {
  if (pushDeviceTableEnsured) {
    return;
  }

  if (!pushDeviceTablePromise) {
    pushDeviceTablePromise = createPushDeviceStorage()
      .then(() => {
        pushDeviceTableEnsured = true;
      })
      .finally(() => {
        pushDeviceTablePromise = null;
      });
  }

  await pushDeviceTablePromise;
}

async function createPushDeviceStorage(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "UserPushDevicePlatform" AS ENUM ('IOS');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END
    $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserPushDevice" (
      "id" TEXT PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "businessId" TEXT REFERENCES "Business"("id") ON DELETE SET NULL,
      "platform" "UserPushDevicePlatform" NOT NULL DEFAULT 'IOS',
      "pushToken" TEXT NOT NULL UNIQUE,
      "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastNotifiedAt" TIMESTAMP(3),
      "notificationFailures" INTEGER NOT NULL DEFAULT 0,
      "revokedAt" TIMESTAMP(3)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "UserPushDevice_business_platform_revoked_idx"
      ON "UserPushDevice" ("businessId", "platform", "revokedAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "UserPushDevice_user_business_platform_idx"
      ON "UserPushDevice" ("userId", "businessId", "platform");
  `);
}
