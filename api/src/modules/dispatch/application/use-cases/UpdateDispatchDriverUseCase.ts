import { DispatchNotFoundError } from "../errors/DispatchNotFoundError.js";
import { DriverNotFoundError } from "../errors/DriverNotFoundError.js";
import { InvalidDispatchUpdatePayloadError } from "../errors/InvalidDispatchUpdatePayloadError.js";
import type { DispatchEntity, DispatchRepository } from "../ports/DispatchRepository.js";

export type UpdateDispatchDriverInput = {
  dispatchId: unknown;
  driverId: unknown;
};

export class UpdateDispatchDriverUseCase {
  constructor(private readonly dispatchRepository: DispatchRepository) {}

  async execute(input: UpdateDispatchDriverInput): Promise<DispatchEntity> {
    const dispatchId = normalizeRequiredString(input.dispatchId, "dispatchId");
    const driverId = normalizeDriverId(input.driverId);

    if (driverId !== null) {
      const exists = await this.dispatchRepository.driverExists(driverId);
      if (!exists) {
        throw new DriverNotFoundError();
      }
    }

    const updated = await this.dispatchRepository.updateDriverAssignment(
      dispatchId,
      driverId,
    );

    if (!updated) {
      throw new DispatchNotFoundError();
    }

    return updated;
  }
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidDispatchUpdatePayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchUpdatePayloadError(field);
  }

  return normalized;
}

function normalizeDriverId(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new InvalidDispatchUpdatePayloadError("driverId");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchUpdatePayloadError("driverId");
  }

  return normalized;
}
