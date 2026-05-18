import type { OwnerRepository } from "../ports/OwnerRepository.js";

export type ListOwnedBusinessesInput = {
  userId: string;
};

export type ListOwnedBusinessesOutput = {
  items: Array<{
    id: string;
    name: string;
  }>;
  selectedBusinessId: string | null;
};

export class ListOwnedBusinessesUseCase {
  constructor(private readonly ownerRepository: OwnerRepository) {}

  async execute(input: ListOwnedBusinessesInput): Promise<ListOwnedBusinessesOutput> {
    const businesses = await this.ownerRepository.findOwnedBusinesses(input.userId);

    return {
      selectedBusinessId: businesses[0]?.businessId ?? null,
      items: businesses.map((business) => ({
        id: business.businessId,
        name: business.name,
      })),
    };
  }
}
