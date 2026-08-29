import { createHash, randomInt } from "node:crypto";
import { InvalidDriverAuthPayloadError } from "../errors/InvalidDriverAuthPayloadError.js";

const OTP_LENGTH = 6;
const DEFAULT_OTP_TTL_MINUTES = 10;
const DEFAULT_REVIEW_DRIVER_PHONE = "9297669288";
const DEFAULT_REVIEW_DRIVER_CODE = "123456";

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

  const candidates = new Set<string>([normalized]);

  if (normalized.length === 10) {
    candidates.add(`1${normalized}`);
  } else if (normalized.length === 11 && normalized.startsWith("1")) {
    candidates.add(normalized.slice(1));
  }

  return Array.from(candidates);
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

export function getFixedReviewOtpCode(phone: string): string | null {
  const isEnabled = process.env.DRIVER_REVIEW_FIXED_OTP_ENABLED === "1";
  if (!isEnabled) {
    return null;
  }

  const expectedPhone = normalizePhoneDigits(
    process.env.DRIVER_REVIEW_FIXED_OTP_PHONE?.trim() ||
      DEFAULT_REVIEW_DRIVER_PHONE,
  );
  const expectedCode =
    process.env.DRIVER_REVIEW_FIXED_OTP_CODE?.trim() || DEFAULT_REVIEW_DRIVER_CODE;

  if (!expectedPhone || !/^\d{4,8}$/.test(expectedCode)) {
    return null;
  }

  const normalizedInputPhone = normalizePhoneDigits(phone);
  if (normalizedInputPhone !== expectedPhone) {
    return null;
  }

  return expectedCode;
}
