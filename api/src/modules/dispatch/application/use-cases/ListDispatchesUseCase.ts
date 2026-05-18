import { InvalidDispatchListPayloadError } from "../errors/InvalidDispatchListPayloadError.js";
import type {
  DispatchEntity,
  DispatchListFilters,
  DispatchRepository,
} from "../ports/DispatchRepository.js";

export type ListDispatchesInput = {
  filters?: {
    status?: unknown;
  };
};

export class ListDispatchesUseCase {
  constructor(private readonly dispatchRepository: DispatchRepository) {}

  async execute(input: ListDispatchesInput): Promise<DispatchEntity[]> {
    const filters: DispatchListFilters = {};

    if (input.filters?.status !== undefined) {
      filters.status = normalizeStatus(
        input.filters.status,
        "status",
      );
    }

    return this.dispatchRepository.list(filters);
  }
}

function normalizeStatus(value: unknown, field: string): "active" {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "active") return "active";
  }

  throw new InvalidDispatchListPayloadError(field);
}
