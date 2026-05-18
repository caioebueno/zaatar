import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import type {
  BranchOnboardingRecord,
  BusinessOnboardingRepository,
} from "../ports/BusinessOnboardingRepository.js";

export type GetBusinessOnboardingStatusInput = {
  businessId?: string | null;
};

export type GetBusinessOnboardingStatusOutput = {
  basicInfo: {
    bannerPhotoUrl: string | null;
    brandColor: string;
    businessId: string;
    logoUrl: string | null;
    name: string;
    orderLinkUrl: string;
  };
  branches: Array<{
    addressCity: string | null;
    addressComplement: string | null;
    addressDescription: string;
    addressGoogleMapsUrl: string;
    addressLatitude: number | null;
    addressLongitude: number | null;
    addressNumber: string | null;
    addressNumberComplement: string | null;
    addressPlaceId: string | null;
    addressState: string | null;
    addressStreet: string | null;
    addressZipCode: string | null;
    createdAt: string;
    id: string;
    name: string;
    operationHours: unknown;
  }>;
  checklist: {
    basicInfoComplete: boolean;
    branchesComplete: boolean;
    completed: boolean;
    stripeReady: boolean;
  };
  stripe: {
    accountId: string | null;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    payoutsEnabled: boolean;
    readyForPayouts: boolean;
  };
  suggestions: string[];
};

export class GetBusinessOnboardingStatusUseCase {
  constructor(private readonly repository: BusinessOnboardingRepository) {}

  async execute(
    input: GetBusinessOnboardingStatusInput,
  ): Promise<GetBusinessOnboardingStatusOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }
    const branches = await this.repository.listBranchesByBusinessId(businessId);

    const basicInfoComplete = isBasicInfoComplete(business);
    const branchesComplete = branches.length > 0;
    const stripeReady =
      business.stripeDetailsSubmitted &&
      business.stripeChargesEnabled &&
      business.stripePayoutsEnabled;
    const completed = basicInfoComplete && branchesComplete && stripeReady;

    return {
      basicInfo: {
        businessId: business.id,
        name: business.name,
        brandColor: business.brandColor,
        logoUrl: business.logoUrl,
        bannerPhotoUrl: business.bannerPhotoUrl,
        orderLinkUrl: buildOrderLinkUrl(business.id),
      },
      branches: branches.map((branch) => mapBranch(branch)),
      stripe: {
        accountId: business.stripeAccountId,
        detailsSubmitted: business.stripeDetailsSubmitted,
        chargesEnabled: business.stripeChargesEnabled,
        payoutsEnabled: business.stripePayoutsEnabled,
        readyForPayouts: stripeReady,
      },
      checklist: {
        basicInfoComplete,
        branchesComplete,
        stripeReady,
        completed,
      },
      suggestions: [
        "Set support phone and WhatsApp number for customer contact.",
        "Confirm tax, service fee, and receipt legal details.",
        "Configure business hours, delivery radius, and prep lead times.",
        "Connect sales channels and define menu sync ownership.",
      ],
    };
  }
}

function mapBranch(branch: BranchOnboardingRecord): {
  addressCity: string | null;
  addressComplement: string | null;
  addressDescription: string;
  addressGoogleMapsUrl: string;
  addressLatitude: number | null;
  addressLongitude: number | null;
  addressNumber: string | null;
  addressNumberComplement: string | null;
  addressPlaceId: string | null;
  addressState: string | null;
  addressStreet: string | null;
  addressZipCode: string | null;
  createdAt: string;
  id: string;
  name: string;
  operationHours: unknown;
} {
  const latitude =
    branch.address?.lat !== null && branch.address?.lat !== undefined
      ? Number(branch.address.lat)
      : null;
  const longitude =
    branch.address?.lng !== null && branch.address?.lng !== undefined
      ? Number(branch.address.lng)
      : null;

  return {
    id: branch.id,
    name: branch.name,
    createdAt: branch.createdAt.toISOString(),
    operationHours: branch.operationHours,
    addressDescription: branch.address?.description ?? "",
    addressGoogleMapsUrl: branch.address?.googleMapsUrl ?? "",
    addressPlaceId: branch.address?.placeId ?? null,
    addressLatitude: Number.isFinite(latitude) ? latitude : null,
    addressLongitude: Number.isFinite(longitude) ? longitude : null,
    addressStreet: branch.address?.street ?? null,
    addressNumber: branch.address?.number ?? null,
    addressCity: branch.address?.city ?? null,
    addressState: branch.address?.state ?? null,
    addressZipCode: branch.address?.zipCode ?? null,
    addressComplement: branch.address?.complement ?? null,
    addressNumberComplement: branch.address?.numberComplement ?? null,
  };
}

function isBasicInfoComplete(business: {
  bannerPhotoUrl: string | null;
  logoUrl: string | null;
  name: string;
}): boolean {
  return Boolean(business.name.trim() && business.logoUrl?.trim());
}

function buildOrderLinkUrl(businessId: string): string {
  const base =
    process.env.ORDER_LINK_BASE_URL?.trim() ||
    process.env.WEB_ORDER_LINK_BASE_URL?.trim() ||
    "http://localhost:3000/menu";
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}businessId=${encodeURIComponent(businessId)}`;
}
