import { InvalidDispatchListPayloadError } from "../errors/InvalidDispatchListPayloadError.js";
import type {
  DispatchEntity,
  DispatchListFilters,
  DispatchRepository,
} from "../ports/DispatchRepository.js";

export type ListDispatchesInput = {
  filters?: {
    endAt?: unknown;
    include?: unknown;
    startAt?: unknown;
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

    if (input.filters?.startAt !== undefined) {
      filters.startAt = normalizeDate(input.filters.startAt, "startAt");
    }

    if (input.filters?.endAt !== undefined) {
      filters.endAt = normalizeDate(input.filters.endAt, "endAt");
    }

    if (input.filters?.include !== undefined) {
      filters.includeRoutePoints = normalizeInclude(input.filters.include);
    }

    if (
      filters.startAt &&
      filters.endAt &&
      filters.startAt.getTime() > filters.endAt.getTime()
    ) {
      throw new InvalidDispatchListPayloadError("dateRange");
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

function normalizeDate(value: unknown, field: "startAt" | "endAt"): Date {
  if (typeof value !== "string") {
    throw new InvalidDispatchListPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchListPayloadError(field);
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (dateOnlyMatch) {
    if (field === "startAt") {
      return new Date(`${normalized}T00:00:00.000Z`);
    }

    return new Date(`${normalized}T23:59:59.999Z`);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidDispatchListPayloadError(field);
  }

  return parsed;
}

function normalizeInclude(value: unknown): boolean {
  if (typeof value !== "string") {
    throw new InvalidDispatchListPayloadError("include");
  }

  const includes = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const include of includes) {
    if (include !== "routePoints") {
      throw new InvalidDispatchListPayloadError("include");
    }
  }

  return includes.includes("routePoints");
}
