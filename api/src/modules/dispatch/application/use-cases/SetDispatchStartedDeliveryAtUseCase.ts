import { DispatchNotFoundError } from "../errors/DispatchNotFoundError.js";
import { DriverDispatchPermissionDeniedError } from "../errors/DriverDispatchPermissionDeniedError.js";
import { InvalidDispatchStartedDeliveryPayloadError } from "../errors/InvalidDispatchStartedDeliveryPayloadError.js";
import type { DispatchRepository } from "../ports/DispatchRepository.js";

export type SetDispatchStartedDeliveryAtInput = {
  dispatchId: unknown;
  driverId: unknown;
  startedDeliveryAt?: unknown;
};

export type SetDispatchStartedDeliveryAtOutput = {
  dispatchId: string;
  startedDeliveryAt: string;
};

export class SetDispatchStartedDeliveryAtUseCase {
  constructor(private readonly dispatchRepository: DispatchRepository) {}

  async execute(
    input: SetDispatchStartedDeliveryAtInput,
  ): Promise<SetDispatchStartedDeliveryAtOutput> {
    const dispatchId = normalizeRequiredString(input.dispatchId, "dispatchId");
    const driverId = normalizeRequiredString(input.driverId, "driverId");
    const startedDeliveryAt = normalizeStartedDeliveryAt(input.startedDeliveryAt);

    const assignedDriverId =
      await this.dispatchRepository.findDriverIdByDispatchId(dispatchId);

    if (!assignedDriverId) {
      throw new DispatchNotFoundError();
    }

    if (assignedDriverId !== driverId) {
      throw new DriverDispatchPermissionDeniedError();
    }

    const updated = await this.dispatchRepository.setStartedDeliveryAt(
      dispatchId,
      startedDeliveryAt,
    );

    if (!updated) {
      throw new DispatchNotFoundError();
    }

    await this.dispatchRepository.ensureActiveRouteSession(
      dispatchId,
      driverId,
      startedDeliveryAt,
    );

    return updated;
  }
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidDispatchStartedDeliveryPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchStartedDeliveryPayloadError(field);
  }

  return normalized;
}

function normalizeStartedDeliveryAt(value: unknown): Date {
  if (value === undefined || value === null || value === "") {
    return new Date();
  }

  if (typeof value !== "string") {
    throw new InvalidDispatchStartedDeliveryPayloadError("startedDeliveryAt");
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidDispatchStartedDeliveryPayloadError("startedDeliveryAt");
  }

  return parsed;
}
