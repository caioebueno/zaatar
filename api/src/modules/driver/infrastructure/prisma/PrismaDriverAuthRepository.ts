import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type {
  CreateDriverOtpChallengeInput,
  DriverAuthEntity,
  DriverAuthRepository,
  DriverOtpChallengeEntity,
} from "../../application/ports/DriverAuthRepository.js";

type DriverRow = {
  active: boolean;
  activatedAt: Date | null;
  deactivatedAt: Date | null;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

const DRIVER_OTP_COUNTRY_CODE_PREFIX = "DRV:";
const DRIVER_OTP_COUNTRY_CODE_MARKER = `${DRIVER_OTP_COUNTRY_CODE_PREFIX}OTP`;

export class PrismaDriverAuthRepository implements DriverAuthRepository {
  async findActiveDriverByPhone(phoneCandidates: string[]): Promise<DriverAuthEntity | null> {
    if (phoneCandidates.length === 0) {
      return null;
    }

    const rows = await prisma.$queryRaw<DriverRow[]>`
      SELECT
        "id",
        "name",
        "active",
        "activatedAt",
        "deactivatedAt",
        "priorityLevel",
        "phone"
      FROM "Driver"
      WHERE "phone" IN (${Prisma.join(phoneCandidates)})
      ORDER BY "createdAt" ASC
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async updateDriverPhone(driverId: string, phone: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE "Driver"
      SET "phone" = ${phone}
      WHERE "id" = ${driverId}
    `;
  }

  async createOtpChallenge(input: CreateDriverOtpChallengeInput): Promise<void> {
    await prisma.customerOtpChallenge.create({
      data: {
        id: randomUUID(),
        customerId: null,
        phone: input.phone,
        countryCode: DRIVER_OTP_COUNTRY_CODE_MARKER,
        channel: input.channel,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        maxAttempts: 5,
      },
    });
  }

  async findLatestValidOtpChallenge(
    phone: string,
  ): Promise<DriverOtpChallengeEntity | null> {
    const challenge = await prisma.customerOtpChallenge.findFirst({
      where: {
        phone,
        customerId: null,
        countryCode: {
          startsWith: DRIVER_OTP_COUNTRY_CODE_PREFIX,
        },
        usedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return challenge;
  }

  async markOtpChallengeAttempt(input: {
    challengeId: string;
    markUsed: boolean;
    nextAttemptCount: number;
  }): Promise<void> {
    await prisma.customerOtpChallenge.update({
      where: {
        id: input.challengeId,
      },
      data: {
        attemptCount: input.nextAttemptCount,
        lastAttemptAt: new Date(),
        ...(input.markUsed ? { usedAt: new Date() } : {}),
      },
    });
  }
}
