import { createHash, randomInt } from "node:crypto";
import { InvalidDriverAuthPayloadError } from "../errors/InvalidDriverAuthPayloadError.js";

const OTP_LENGTH = 6;
const DEFAULT_OTP_TTL_MINUTES = 10;

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizePhone(rawPhone: string): string {
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) {
    throw new InvalidDriverAuthPayloadError("phone");
  }
  return normalized;
}

export function buildPhoneCandidates(rawPhone: string): string[] {
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) return [];

  return [normalized];
}

export function normalizeOtpCode(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidDriverAuthPayloadError("code");
  }

  const normalized = value.trim();
  if (!/^\d{4,8}$/.test(normalized)) {
    throw new InvalidDriverAuthPayloadError("code");
  }

  return normalized;
}

export function normalizeLanguage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
}

export function parseOtpTtlMinutes(): number {
  const parsed = Number.parseInt(process.env.DRIVER_OTP_TTL_MINUTES ?? "", 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_OTP_TTL_MINUTES;
  }
  return parsed;
}

export function calculateOtpExpiryDate(now = new Date()): Date {
  return new Date(now.getTime() + parseOtpTtlMinutes() * 60 * 1000);
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

export function hashValue(raw: string): string {
  const secret =
    process.env.DRIVER_OTP_SECRET?.trim() ||
    process.env.CUSTOMER_AUTH_SECRET?.trim() ||
    process.env.TWILIO_AUTH_TOKEN?.trim() ||
    "dev-driver-otp-secret";

  return createHash("sha256")
    .update(`${secret}::${raw}`)
    .digest("hex");
}

export function buildOtpHash(phone: string, code: string): string {
  return hashValue(`driver-otp:${phone}:${code}`);
}
