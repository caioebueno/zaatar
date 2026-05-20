import { DriverNotFoundError } from "../errors/DriverNotFoundError.js";
import { InvalidDriverAuthPayloadError } from "../errors/InvalidDriverAuthPayloadError.js";
import type { DriverAuthRepository } from "../ports/DriverAuthRepository.js";
import type { DriverOtpChannel, DriverOtpSender } from "../ports/DriverOtpSender.js";
import {
  buildOtpHash,
  buildPhoneCandidates,
  calculateOtpExpiryDate,
  generateOtpCode,
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

    const code = generateOtpCode();
    const expiresAt = calculateOtpExpiryDate();
    const channel = normalizeDriverOtpChannel(input.channel);

    await this.driverAuthRepository.createOtpChallenge({
      phone: normalizedPhone,
      channel,
      codeHash: buildOtpHash(normalizedPhone, code),
      expiresAt,
    });

    await this.driverOtpSender.send({
      phone: normalizedPhone,
      code,
      channel,
      language: normalizeLanguage(input.language),
      sendAlsoSms: normalizeOptionalBoolean(input.sendAlsoSms),
      sendAlsoWhatsApp: normalizeOptionalBoolean(input.sendAlsoWhatsApp),
    });

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

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  return value === true;
}

function normalizeDriverOtpChannel(value: unknown): DriverOtpChannel {
  if (value === undefined || value === null) {
    return "WHATSAPP";
  }

  if (typeof value !== "string") {
    throw new InvalidDriverAuthPayloadError("channel");
  }

  const normalized = value.trim().toUpperCase();
  if (normalized !== "WHATSAPP" && normalized !== "SMS") {
    throw new InvalidDriverAuthPayloadError("channel");
  }

  return normalized;
}
