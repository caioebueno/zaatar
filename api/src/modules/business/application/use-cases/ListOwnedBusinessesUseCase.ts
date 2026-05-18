import type { BusinessRepository } from "../ports/BusinessRepository.js";

export type ListOwnedBusinessesInput = {
  userId: string;
};

export type ListOwnedBusinessesOutput = {
  items: Array<{
    id: string;
    logoUrl: string | null;
    name: string;
  }>;
  selectedBusinessId: string | null;
};

export class ListOwnedBusinessesUseCase {
  constructor(private readonly businessRepository: BusinessRepository) {}

  async execute(
    input: ListOwnedBusinessesInput,
  ): Promise<ListOwnedBusinessesOutput> {
    const businesses = await this.businessRepository.findOwnedBusinesses(input.userId);

    return {
      selectedBusinessId: businesses[0]?.businessId ?? null,
      items: businesses.map((business) => ({
        id: business.businessId,
        name: business.name,
        logoUrl: business.logoUrl,
      })),
    };
  }
}
