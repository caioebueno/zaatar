import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../errors/InvalidOnboardingPayloadError.js";
import type { BusinessOnboardingRepository } from "../ports/BusinessOnboardingRepository.js";

export type UpdateBusinessOnboardingBasicInfoInput = {
  bannerPhotoUrl?: unknown;
  brandColor?: unknown;
  businessId?: string | null;
  logoUrl?: unknown;
  name?: unknown;
};

export type UpdateBusinessOnboardingBasicInfoOutput = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  businessId: string;
  logoUrl: string | null;
  name: string;
  orderLinkUrl: string;
};

export class UpdateBusinessOnboardingBasicInfoUseCase {
  constructor(private readonly repository: BusinessOnboardingRepository) {}

  async execute(
    input: UpdateBusinessOnboardingBasicInfoInput,
  ): Promise<UpdateBusinessOnboardingBasicInfoOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const current = await this.repository.findById(businessId);
    if (!current) {
      throw new BusinessNotFoundError();
    }

    const updated = await this.repository.updateBasicInfo(businessId, {
      name: parseName(input.name, current.name),
      brandColor: parseBrandColor(input.brandColor, current.brandColor),
      logoUrl: parseOptionalUrl(input.logoUrl, current.logoUrl, "logoUrl"),
      bannerPhotoUrl: parseOptionalUrl(
        input.bannerPhotoUrl,
        current.bannerPhotoUrl,
        "bannerPhotoUrl",
      ),
    });

    if (!updated) {
      throw new BusinessNotFoundError();
    }

    return {
      businessId: updated.id,
      name: updated.name,
      brandColor: updated.brandColor,
      logoUrl: updated.logoUrl,
      bannerPhotoUrl: updated.bannerPhotoUrl,
      orderLinkUrl: buildOrderLinkUrl(updated.id),
    };
  }
}

function parseName(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError("name");
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > 120) {
    throw new InvalidOnboardingPayloadError("name");
  }
  return normalized;
}

function parseBrandColor(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError("brandColor");
  }
  const normalized = value.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(normalized)) {
    throw new InvalidOnboardingPayloadError("brandColor");
  }
  return normalized;
}

function parseOptionalUrl(
  value: unknown,
  fallback: string | null,
  field: "logoUrl" | "bannerPhotoUrl",
): string | null {
  if (value === undefined) return fallback;
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 2048) {
    throw new InvalidOnboardingPayloadError(field);
  }

  if (normalized.startsWith("/")) return normalized;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new InvalidOnboardingPayloadError(field);
    }
    return normalized;
  } catch {
    throw new InvalidOnboardingPayloadError(field);
  }
}

function buildOrderLinkUrl(businessId: string): string {
  const base =
    process.env.ORDER_LINK_BASE_URL?.trim() ||
    process.env.WEB_ORDER_LINK_BASE_URL?.trim() ||
    "http://localhost:3000/menu";
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}businessId=${encodeURIComponent(businessId)}`;
}
