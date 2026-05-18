import { StationBusinessContextRequiredError } from "../errors/StationBusinessContextRequiredError.js";
import type { StationListItem, StationRepository } from "../ports/StationRepository.js";

export type ListStationsInput = {
  businessId?: unknown;
};

export type ListStationsOutput = {
  items: StationListItem[];
};

export class ListStationsUseCase {
  constructor(private readonly repository: StationRepository) {}

  async execute(input: ListStationsInput): Promise<ListStationsOutput> {
    const businessId = normalizeBusinessId(input.businessId);
    if (!businessId) {
      throw new StationBusinessContextRequiredError();
    }

    const items = await this.repository.listStations({ businessId });
    return { items };
  }
}

function normalizeBusinessId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}
