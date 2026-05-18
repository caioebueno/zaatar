import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import { EmailAlreadyRegisteredError } from "../../application/errors/EmailAlreadyRegisteredError.js";
import type {
  CreateOwnerInput,
  OwnedBusinessRecord,
  OwnerAuthRecord,
  OwnerOtpChallengeRecord,
  OwnerRecord,
  OwnerRepository,
} from "../../application/ports/OwnerRepository.js";

export class PrismaOwnerRepository implements OwnerRepository {
  async create(input: CreateOwnerInput): Promise<OwnerRecord> {
    try {
      const now = new Date();
      const [owner] = await prisma.$queryRaw<
        Array<{
          createdAt: Date;
          email: string;
          id: string;
          name: string;
          phone: string | null;
        }>
      >`
        INSERT INTO "User" (
          "id",
          "name",
          "email",
          "phone",
          "passwordHash",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          ${input.id},
          ${input.name},
          ${input.email},
          ${input.phone},
          ${input.passwordHash},
          ${now},
          ${now}
        )
        RETURNING
          "id",
          "name",
          "email",
          "phone",
          "createdAt"
      `;

      if (!owner) {
        throw new Error("Failed to create owner");
      }

      return {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone ?? "",
        createdAt: owner.createdAt,
      };
    } catch (error) {
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002") ||
        isUniqueConstraintViolation(error)
      ) {
        throw new EmailAlreadyRegisteredError();
      }

      throw error;
    }
  }

  async createOtpChallenge(input: {
    codeHash: string;
    phone: string;
    expiresAt: Date;
    ownerId: string;
  }): Promise<void> {
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "OwnerOtpChallenge" (
        "id",
        "createdAt",
        "updatedAt",
        "ownerId",
        "phone",
        "codeHash",
        "expiresAt",
        "maxAttempts"
      )
      VALUES (
        ${randomUUID()},
        ${now},
        ${now},
        ${input.ownerId},
        ${input.phone},
        ${input.codeHash},
        ${input.expiresAt},
        5
      )
    `;
  }

  async findByEmailForAuth(email: string): Promise<OwnerAuthRecord | null> {
    const rows = await prisma.$queryRaw<
      Array<{
        email: string;
        id: string;
        name: string;
        passwordHash: string;
        phone: string | null;
      }>
    >`
      SELECT
        "id",
        "name",
        "email",
        "phone",
        "passwordHash"
      FROM "User"
      WHERE "email" = ${email}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async findByPhoneForAuth(phoneCandidates: string[]): Promise<OwnerAuthRecord | null> {
    if (phoneCandidates.length === 0) {
      return null;
    }

    const rows = await prisma.$queryRaw<
      Array<{
        email: string;
        id: string;
        name: string;
        passwordHash: string;
        phone: string | null;
      }>
    >`
      SELECT
        "id",
        "name",
        "email",
        "phone",
        "passwordHash"
      FROM "User"
      WHERE regexp_replace(COALESCE("phone", ''), '\\D', '', 'g')
        IN (${Prisma.join(phoneCandidates)})
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async findLatestValidOtpChallenge(
    phone: string,
  ): Promise<OwnerOtpChallengeRecord | null> {
    const rows = await prisma.$queryRaw<
      Array<{
        attemptCount: number;
        codeHash: string;
        createdAt: Date;
        phone: string;
        expiresAt: Date;
        id: string;
        maxAttempts: number;
        ownerId: string;
        usedAt: Date | null;
      }>
    >`
      SELECT
        challenge."id",
        challenge."ownerId",
        challenge."phone",
        challenge."codeHash",
        challenge."expiresAt",
        challenge."usedAt",
        challenge."attemptCount",
        challenge."maxAttempts",
        challenge."createdAt"
      FROM "OwnerOtpChallenge" challenge
      WHERE challenge."phone" = ${phone}
        AND challenge."usedAt" IS NULL
        AND challenge."expiresAt" >= NOW()
      ORDER BY challenge."createdAt" DESC
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async markOtpChallengeAttempt(input: {
    challengeId: string;
    markUsed: boolean;
    nextAttemptCount: number;
  }): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "OwnerOtpChallenge"
      SET
        "attemptCount" = ${input.nextAttemptCount},
        "lastAttemptAt" = NOW(),
        "updatedAt" = NOW(),
        "usedAt" = CASE
          WHEN ${input.markUsed} = true THEN NOW()
          ELSE "usedAt"
        END
      WHERE "id" = ${input.challengeId}
    `;
  }

  async findOwnedBusinesses(userId: string): Promise<OwnedBusinessRecord[]> {
    const rows = await prisma.businessOwner.findMany({
      where: { userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows
      .map((row) => {
        if (!row.business) return null;
        return {
          businessId: row.business.id,
          name: row.business.name,
        } satisfies OwnedBusinessRecord;
      })
      .filter((row): row is OwnedBusinessRecord => row !== null);
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as {
    code?: unknown;
    message?: unknown;
    meta?: unknown;
  };

  if (record.code === "P2010") {
    const meta = record.meta as { code?: unknown; message?: unknown } | undefined;
    if (meta?.code === "23505") {
      return true;
    }
    if (typeof meta?.message === "string" && meta.message.includes("duplicate key")) {
      return true;
    }
  }

  if (record.code === "23505") {
    return true;
  }

  if (typeof record.message === "string" && record.message.includes("duplicate key")) {
    return true;
  }

  return false;
}
