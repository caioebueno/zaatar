import { timingSafeEqual } from "node:crypto";
import { DriverNotFoundError } from "../errors/DriverNotFoundError.js";
import { DriverOtpExpiredOrNotFoundError } from "../errors/DriverOtpExpiredOrNotFoundError.js";
import { DriverOtpInvalidError } from "../errors/DriverOtpInvalidError.js";
import { InvalidDriverAuthPayloadError } from "../errors/InvalidDriverAuthPayloadError.js";
import type { DriverAuthRepository } from "../ports/DriverAuthRepository.js";
import type { DriverAccessTokenSigner } from "../ports/DriverAccessTokenSigner.js";
import {
  buildOtpHash,
  buildPhoneCandidates,
  normalizeOtpCode,
  normalizePhone,
} from "./driverAuthShared.js";

export type VerifyDriverOtpInput = {
  code: unknown;
  phone: unknown;
};

export type VerifyDriverOtpOutput = {
  accessToken: string;
  driver: {
    active: boolean;
    id: string;
    name: string;
    phone: string;
    priorityLevel: number;
  };
  expiresAt: string;
  ok: true;
};

export class VerifyDriverOtpUseCase {
  constructor(
    private readonly driverAuthRepository: DriverAuthRepository,
    private readonly accessTokenSigner: DriverAccessTokenSigner,
  ) {}

  async execute(input: VerifyDriverOtpInput): Promise<VerifyDriverOtpOutput> {
    const rawPhone = normalizeRequiredString(input.phone, "phone");
    const normalizedPhone = normalizePhone(rawPhone);
    const code = normalizeOtpCode(input.code);

    const phoneCandidates = buildPhoneCandidates(normalizedPhone);
    const driver = await this.driverAuthRepository.findActiveDriverByPhone(phoneCandidates);
    if (!driver || !driver.active) {
      throw new DriverNotFoundError();
    }

    if (driver.phone !== normalizedPhone) {
      await this.driverAuthRepository.updateDriverPhone(driver.id, normalizedPhone);
    }

    const challenge = await this.driverAuthRepository.findLatestValidOtpChallenge(
      normalizedPhone,
    );

    if (!challenge) {
      throw new DriverOtpExpiredOrNotFoundError();
    }

    if (challenge.attemptCount >= challenge.maxAttempts) {
      await this.driverAuthRepository.markOtpChallengeAttempt({
        challengeId: challenge.id,
        nextAttemptCount: challenge.attemptCount,
        markUsed: true,
      });

      throw new DriverOtpExpiredOrNotFoundError();
    }

    const nextAttemptCount = challenge.attemptCount + 1;
    const expectedHash = challenge.codeHash;
    const providedHash = buildOtpHash(normalizedPhone, code);

    const isValidCode = safelyCompareHash(providedHash, expectedHash);
    if (!isValidCode) {
      const remainingAttempts = Math.max(challenge.maxAttempts - nextAttemptCount, 0);

      await this.driverAuthRepository.markOtpChallengeAttempt({
        challengeId: challenge.id,
        nextAttemptCount,
        markUsed: remainingAttempts === 0,
      });

      throw new DriverOtpInvalidError(remainingAttempts);
    }

    await this.driverAuthRepository.markOtpChallengeAttempt({
      challengeId: challenge.id,
      nextAttemptCount,
      markUsed: true,
    });

    const signedToken = this.accessTokenSigner.sign({
      driverId: driver.id,
      name: driver.name,
      phone: normalizedPhone,
    });

    return {
      ok: true,
      accessToken: signedToken.accessToken,
      expiresAt: signedToken.expiresAt.toISOString(),
      driver: {
        id: driver.id,
        name: driver.name,
        phone: normalizedPhone,
        active: driver.active,
        priorityLevel: driver.priorityLevel,
      },
    };
  }
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidDriverAuthPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDriverAuthPayloadError(field);
  }

  return normalized;
}

function safelyCompareHash(currentHash: string, expectedHash: string): boolean {
  const currentBuffer = Buffer.from(currentHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (currentBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(currentBuffer, expectedBuffer);
}
