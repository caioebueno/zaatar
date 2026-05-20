import { InvalidDispatchListPayloadError } from "../errors/InvalidDispatchListPayloadError.js";
import type { DispatchEntity, DispatchRepository } from "../ports/DispatchRepository.js";

export type ListDriverDispatchesByDateRangeInput = {
  driverId: unknown;
  endDate?: unknown;
  startDate?: unknown;
};

export class ListDriverDispatchesByDateRangeUseCase {
  constructor(private readonly dispatchRepository: DispatchRepository) {}

  async execute(
    input: ListDriverDispatchesByDateRangeInput,
  ): Promise<DispatchEntity[]> {
    const driverId = normalizeDriverId(input.driverId);
    const start = normalizeDate(input.startDate, "startDate", "start");
    const end = normalizeDate(input.endDate, "endDate", "end");

    if (start.getTime() > end.getTime()) {
      throw new InvalidDispatchListPayloadError("dateRange");
    }

    return this.dispatchRepository.findByDriverDateRange(driverId, start, end);
  }
}

function normalizeDriverId(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidDispatchListPayloadError("driverId");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchListPayloadError("driverId");
  }

  return normalized;
}

function normalizeDate(
  value: unknown,
  field: "startDate" | "endDate",
  fallbackField: "start" | "end",
): Date {
  if (typeof value !== "string") {
    throw new InvalidDispatchListPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchListPayloadError(field);
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (dateOnlyMatch) {
    if (field === "startDate") {
      return new Date(`${normalized}T00:00:00.000Z`);
    }
    return new Date(`${normalized}T23:59:59.999Z`);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidDispatchListPayloadError(field === "startDate" ? field : fallbackField);
  }

  return parsed;
}
