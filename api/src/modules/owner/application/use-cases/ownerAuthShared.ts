import { createHash, randomInt } from "node:crypto";
import { InvalidOwnerAuthPayloadError } from "../errors/InvalidOwnerAuthPayloadError.js";

const OTP_LENGTH = 6;
const DEFAULT_OTP_TTL_MINUTES = 10;

export function normalizePhone(value: unknown, field = "phone"): string {
  if (typeof value !== "string") {
    throw new InvalidOwnerAuthPayloadError(field);
  }

  const normalized = value.replace(/\D/g, "");
  if (!normalized) {
    throw new InvalidOwnerAuthPayloadError(field);
  }

  if (normalized.length < 10 || normalized.length > 20) {
    throw new InvalidOwnerAuthPayloadError(field);
  }

  return normalized;
}

export function buildPhoneCandidates(rawPhone: string): string[] {
  const normalized = normalizePhone(rawPhone);
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
    throw new InvalidOwnerAuthPayloadError("code");
  }

  const normalized = value.trim();
  if (!/^\d{4,8}$/.test(normalized)) {
    throw new InvalidOwnerAuthPayloadError("code");
  }

  return normalized;
}

export function normalizeLanguage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized || undefined;
}

export function parseOtpTtlMinutes(): number {
  const parsed = Number.parseInt(process.env.OWNER_OTP_TTL_MINUTES ?? "", 10);
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
    process.env.OWNER_OTP_SECRET?.trim() ||
    process.env.CUSTOMER_AUTH_SECRET?.trim() ||
    process.env.TWILIO_AUTH_TOKEN?.trim() ||
    "dev-owner-otp-secret";

  return createHash("sha256").update(`${secret}::${raw}`).digest("hex");
}

export function buildOtpHash(phone: string, code: string): string {
  return hashValue(`owner-otp:${phone}:${code}`);
}
