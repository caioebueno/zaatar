import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import type { BusinessRepository } from "../ports/BusinessRepository.js";

export type GetCurrentBusinessInput = {
  businessId?: string | null;
};

export type GetCurrentBusinessOutput = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  branches: Array<{
    address: {
      city: string | null;
      complement: string | null;
      description: string;
      googleMapsUrl: string;
      lat: number | null;
      lng: number | null;
      number: string | null;
      numberComplement: string | null;
      placeId: string | null;
      state: string | null;
      street: string | null;
      zipCode: string | null;
    } | null;
    createdAt: string;
    id: string;
    name: string;
    operationHours: unknown;
  }>;
  createdAt: string;
  id: string;
  logoUrl: string | null;
  name: string;
};

export class GetCurrentBusinessUseCase {
  constructor(private readonly repository: BusinessRepository) {}

  async execute(input: GetCurrentBusinessInput): Promise<GetCurrentBusinessOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findCurrentBusinessById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }

    return {
      id: business.id,
      createdAt: business.createdAt.toISOString(),
      name: business.name,
      logoUrl: business.logoUrl,
      bannerPhotoUrl: business.bannerPhotoUrl,
      brandColor: business.brandColor,
      branches: business.branches.map((branch) => {
        const lat =
          branch.address?.lat !== null && branch.address?.lat !== undefined
            ? Number(branch.address.lat)
            : null;
        const lng =
          branch.address?.lng !== null && branch.address?.lng !== undefined
            ? Number(branch.address.lng)
            : null;

        return {
          id: branch.id,
          createdAt: branch.createdAt.toISOString(),
          name: branch.name,
          operationHours: branch.operationHours,
          address: branch.address
            ? {
                description: branch.address.description,
                googleMapsUrl: branch.address.googleMapsUrl,
                placeId: branch.address.placeId,
                lat: Number.isFinite(lat) ? lat : null,
                lng: Number.isFinite(lng) ? lng : null,
                street: branch.address.street,
                number: branch.address.number,
                city: branch.address.city,
                state: branch.address.state,
                zipCode: branch.address.zipCode,
                complement: branch.address.complement,
                numberComplement: branch.address.numberComplement,
              }
            : null,
        };
      }),
    };
  }
}

