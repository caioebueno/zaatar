import { timingSafeEqual } from "node:crypto";
import { OwnerOtpExpiredOrNotFoundError } from "../errors/OwnerOtpExpiredOrNotFoundError.js";
import { OwnerOtpInvalidError } from "../errors/OwnerOtpInvalidError.js";
import { OwnerNotFoundError } from "../errors/OwnerNotFoundError.js";
import type { AccessTokenSigner } from "../ports/AccessTokenSigner.js";
import type { OwnedBusinessRecord, OwnerRepository } from "../ports/OwnerRepository.js";
import {
  buildPhoneCandidates,
  buildOtpHash,
  normalizeOtpCode,
  normalizePhone,
} from "./ownerAuthShared.js";

export type VerifyOwnerOtpInput = {
  code: unknown;
  phone: unknown;
};

export type VerifyOwnerOtpOutput = {
  accessToken: string;
  businesses: Array<{
    id: string;
    name: string;
  }>;
  expiresAt: string;
  ok: true;
  owner: {
    email: string;
    id: string;
    name: string;
    phone: string | null;
  };
  selectedBusinessId: string | null;
};

export class VerifyOwnerOtpUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly accessTokenSigner: AccessTokenSigner,
  ) {}

  async execute(input: VerifyOwnerOtpInput): Promise<VerifyOwnerOtpOutput> {
    const phone = normalizePhone(input.phone);
    const code = normalizeOtpCode(input.code);

    const owner = await this.ownerRepository.findByPhoneForAuth(
      buildPhoneCandidates(phone),
    );
    if (!owner) {
      throw new OwnerNotFoundError();
    }

    const challenge = await this.ownerRepository.findLatestValidOtpChallenge(phone);
    if (!challenge) {
      throw new OwnerOtpExpiredOrNotFoundError();
    }

    if (challenge.attemptCount >= challenge.maxAttempts) {
      await this.ownerRepository.markOtpChallengeAttempt({
        challengeId: challenge.id,
        nextAttemptCount: challenge.attemptCount,
        markUsed: true,
      });
      throw new OwnerOtpExpiredOrNotFoundError();
    }

    const nextAttemptCount = challenge.attemptCount + 1;
    const expectedHash = challenge.codeHash;
    const providedHash = buildOtpHash(phone, code);

    const isValidCode = safelyCompareHash(providedHash, expectedHash);
    if (!isValidCode) {
      const remainingAttempts = Math.max(challenge.maxAttempts - nextAttemptCount, 0);
      await this.ownerRepository.markOtpChallengeAttempt({
        challengeId: challenge.id,
        nextAttemptCount,
        markUsed: remainingAttempts === 0,
      });
      throw new OwnerOtpInvalidError(remainingAttempts);
    }

    await this.ownerRepository.markOtpChallengeAttempt({
      challengeId: challenge.id,
      nextAttemptCount,
      markUsed: true,
    });

    const token = this.accessTokenSigner.sign({
      userId: owner.id,
      email: owner.email,
      name: owner.name,
    });

    const businesses = await this.ownerRepository.findOwnedBusinesses(owner.id);
    const selectedBusinessId = businesses[0]?.businessId ?? null;

    return {
      ok: true,
      accessToken: token.accessToken,
      expiresAt: token.expiresAt.toISOString(),
      owner: {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        phone: owner.phone,
      },
      selectedBusinessId,
      businesses: businesses.map((business: OwnedBusinessRecord) => ({
        id: business.businessId,
        name: business.name,
      })),
    };
  }
}

function safelyCompareHash(currentHash: string, expectedHash: string): boolean {
  const currentBuffer = Buffer.from(currentHash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (currentBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(currentBuffer, expectedBuffer);
}
