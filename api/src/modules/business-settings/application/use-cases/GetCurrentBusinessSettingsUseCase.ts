import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import type { BusinessSettingsRepository } from "../ports/BusinessSettingsRepository.js";

export type GetCurrentBusinessSettingsInput = {
  businessId?: string | null;
};

export type GetCurrentBusinessSettingsOutput = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  businessId: string;
  logoUrl: string | null;
  name: string;
  orderLinkUrl: string;
};

export class GetCurrentBusinessSettingsUseCase {
  constructor(private readonly repository: BusinessSettingsRepository) {}

  async execute(
    input: GetCurrentBusinessSettingsInput,
  ): Promise<GetCurrentBusinessSettingsOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }

    return {
      businessId: business.id,
      name: business.name,
      brandColor: business.brandColor,
      logoUrl: business.logoUrl,
      bannerPhotoUrl: business.bannerPhotoUrl,
      orderLinkUrl: buildOrderLinkUrl(business.id),
    };
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
