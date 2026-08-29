import { DriverNotFoundError } from "../errors/DriverNotFoundError.js";
import { InvalidDriverAuthPayloadError } from "../errors/InvalidDriverAuthPayloadError.js";
import type { DriverAuthRepository } from "../ports/DriverAuthRepository.js";
import type { DriverOtpChannel, DriverOtpSender } from "../ports/DriverOtpSender.js";
import {
  buildOtpHash,
  buildPhoneCandidates,
  calculateOtpExpiryDate,
  generateOtpCode,
  getFixedReviewOtpCode,
  normalizeLanguage,
  normalizePhone,
  parseOtpTtlMinutes,
} from "./driverAuthShared.js";

export type SendDriverOtpInput = {
  channel: unknown;
  language: unknown;
  phone: unknown;
  sendAlsoSms: unknown;
  sendAlsoWhatsApp: unknown;
};

export type SendDriverOtpOutput = {
  expiresInMinutes: number;
  ok: true;
};

export class SendDriverOtpUseCase {
  constructor(
    private readonly driverAuthRepository: DriverAuthRepository,
    private readonly driverOtpSender: DriverOtpSender,
  ) {}

  async execute(input: SendDriverOtpInput): Promise<SendDriverOtpOutput> {
    const rawPhone = normalizeRequiredString(input.phone, "phone");
    const normalizedPhone = normalizePhone(rawPhone);
    const phoneCandidates = buildPhoneCandidates(normalizedPhone);

    const driver = await this.driverAuthRepository.findActiveDriverByPhone(phoneCandidates);
    if (!driver) {
      throw new DriverNotFoundError();
    }

    if (driver.phone !== normalizedPhone) {
      await this.driverAuthRepository.updateDriverPhone(driver.id, normalizedPhone);
    }

    const reviewFixedCode = getFixedReviewOtpCode(normalizedPhone);
    const code = reviewFixedCode ?? generateOtpCode();
    const expiresAt = calculateOtpExpiryDate();
    const channel: DriverOtpChannel = "SMS";

    await this.driverAuthRepository.createOtpChallenge({
      phone: normalizedPhone,
      channel,
      codeHash: buildOtpHash(normalizedPhone, code),
      expiresAt,
    });

    if (!reviewFixedCode) {
      console.log("[driver-otp] sending OTP", {
        phone: maskPhoneForLog(normalizedPhone),
        channel,
        expiresAt: expiresAt.toISOString(),
      });

      await this.driverOtpSender.send({
        phone: normalizedPhone,
        code,
        channel,
        language: normalizeLanguage(input.language),
      });

      console.log("[driver-otp] OTP sent", {
        phone: maskPhoneForLog(normalizedPhone),
        channel,
      });
    }

    return {
      ok: true,
      expiresInMinutes: parseOtpTtlMinutes(),
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

function maskPhoneForLog(phone: string): string {
  if (phone.length <= 4) {
    return phone;
  }

  return `${"*".repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;
}
