import { OwnerNotFoundError } from "../errors/OwnerNotFoundError.js";
import type { OwnerOtpSender } from "../ports/OwnerOtpSender.js";
import type { OwnerRepository } from "../ports/OwnerRepository.js";
import {
  buildPhoneCandidates,
  buildOtpHash,
  calculateOtpExpiryDate,
  generateOtpCode,
  normalizeLanguage,
  normalizePhone,
  parseOtpTtlMinutes,
} from "./ownerAuthShared.js";

export type SendOwnerOtpInput = {
  phone: unknown;
  language: unknown;
};

export type SendOwnerOtpOutput = {
  expiresInMinutes: number;
  ok: true;
};

export class SendOwnerOtpUseCase {
  constructor(
    private readonly ownerRepository: OwnerRepository,
    private readonly ownerOtpSender: OwnerOtpSender,
  ) {}

  async execute(input: SendOwnerOtpInput): Promise<SendOwnerOtpOutput> {
    const phone = normalizePhone(input.phone);
    const phoneCandidates = buildPhoneCandidates(phone);
    if (process.env.DEV === "1") {
      console.log("[owner-auth] phones searched", {
        phone,
        phoneCandidates,
      });
    }

    const owner = await this.ownerRepository.findByPhoneForAuth(phoneCandidates);

    if (!owner) {
      throw new OwnerNotFoundError();
    }

    const code = generateOtpCode();
    const expiresAt = calculateOtpExpiryDate();

    await this.ownerRepository.createOtpChallenge({
      ownerId: owner.id,
      phone,
      codeHash: buildOtpHash(phone, code),
      expiresAt,
    });

    await this.ownerOtpSender.send({
      phone,
      code,
      language: normalizeLanguage(input.language),
    });

    return {
      ok: true,
      expiresInMinutes: parseOtpTtlMinutes(),
    };
  }
}
