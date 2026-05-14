import { InvalidDispatchNextPayloadError } from "../errors/InvalidDispatchNextPayloadError.js";
import type { DispatchEntity, DispatchRepository } from "../ports/DispatchRepository.js";

export type GetNextDispatchForDriverInput = {
  driverId: unknown;
};

export class GetNextDispatchForDriverUseCase {
  constructor(private readonly dispatchRepository: DispatchRepository) {}

  async execute(input: GetNextDispatchForDriverInput): Promise<DispatchEntity | null> {
    const driverId = normalizeDriverId(input.driverId);
    return this.dispatchRepository.findNextForDriver(driverId);
  }
}

function normalizeDriverId(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidDispatchNextPayloadError("driverId");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchNextPayloadError("driverId");
  }

  return normalized;
}
