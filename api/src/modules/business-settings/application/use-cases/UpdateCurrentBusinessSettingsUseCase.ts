import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import { InvalidBusinessSettingsPayloadError } from "../errors/InvalidBusinessSettingsPayloadError.js";
import type {
  BusinessSettingsRepository,
  UpdateBusinessSettingsInput,
} from "../ports/BusinessSettingsRepository.js";

export type UpdateCurrentBusinessSettingsInput = {
  bannerPhotoUrl?: unknown;
  brandColor?: unknown;
  businessId?: string | null;
  logoUrl?: unknown;
  name?: unknown;
};

export type UpdateCurrentBusinessSettingsOutput = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  businessId: string;
  logoUrl: string | null;
  name: string;
  orderLinkUrl: string;
};

export class UpdateCurrentBusinessSettingsUseCase {
  constructor(private readonly repository: BusinessSettingsRepository) {}

  async execute(
    input: UpdateCurrentBusinessSettingsInput,
  ): Promise<UpdateCurrentBusinessSettingsOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const current = await this.repository.findById(businessId);
    if (!current) {
      throw new BusinessNotFoundError();
    }

    const next: UpdateBusinessSettingsInput = {
      name: parseName(input.name, current.name),
      brandColor: parseBrandColor(input.brandColor, current.brandColor),
      logoUrl: parseOptionalUrl(input.logoUrl, current.logoUrl, "logoUrl"),
      bannerPhotoUrl: parseOptionalUrl(
        input.bannerPhotoUrl,
        current.bannerPhotoUrl,
        "bannerPhotoUrl",
      ),
    };

    const updated = await this.repository.updateById(businessId, next);
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
    throw new InvalidBusinessSettingsPayloadError("name");
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidBusinessSettingsPayloadError("name");
  }
  if (normalized.length > 120) {
    throw new InvalidBusinessSettingsPayloadError("name");
  }
  return normalized;
}

function parseBrandColor(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") {
    throw new InvalidBusinessSettingsPayloadError("brandColor");
  }
  const normalized = value.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(normalized)) {
    throw new InvalidBusinessSettingsPayloadError("brandColor");
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
    throw new InvalidBusinessSettingsPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 2048) {
    throw new InvalidBusinessSettingsPayloadError(field);
  }

  if (normalized.startsWith("/")) return normalized;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new InvalidBusinessSettingsPayloadError(field);
    }
    return normalized;
  } catch {
    throw new InvalidBusinessSettingsPayloadError(field);
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
