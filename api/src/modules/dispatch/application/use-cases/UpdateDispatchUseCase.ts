import { InvalidDispatchUpdatePayloadError } from "../errors/InvalidDispatchUpdatePayloadError.js";
import type {
  DispatchEntity,
  DispatchRepository,
  UpdateDispatchStatusInput,
} from "../ports/DispatchRepository.js";

export type UpdateDispatchInput = {
  dispatchAt?: unknown;
  dispatched?: unknown;
  dispatchId: unknown;
  driverId?: unknown;
  queueIndex?: unknown;
};

export class UpdateDispatchUseCase {
  constructor(private readonly dispatchRepository: DispatchRepository) {}

  async execute(input: UpdateDispatchInput): Promise<DispatchEntity> {
    const dispatchId = normalizeRequiredString(input.dispatchId, "dispatchId");
    const dispatched = normalizeOptionalBoolean(input.dispatched, "dispatched");
    const dispatchAt = normalizeOptionalDispatchAt(input.dispatchAt);
    const driverId = normalizeOptionalNullableString(input.driverId, "driverId");
    const queueIndex = normalizeOptionalQueueIndex(input.queueIndex);

    if (
      dispatched === undefined &&
      driverId === undefined &&
      queueIndex === undefined
    ) {
      throw new InvalidDispatchUpdatePayloadError("body");
    }

    if (dispatchAt !== undefined && dispatched === undefined) {
      throw new InvalidDispatchUpdatePayloadError("dispatched");
    }

    return this.dispatchRepository.updateStatus({
      dispatchId,
      dispatched,
      dispatchAt,
      driverId,
      queueIndex,
    } satisfies UpdateDispatchStatusInput);
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

function normalizeOptionalNullableString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return normalizeRequiredString(value, field);
}

function normalizeOptionalBoolean(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new InvalidDispatchUpdatePayloadError(field);
  }

  return value;
}

function normalizeOptionalDispatchAt(value: unknown): string | null | undefined {
  if (value === undefined || value === null) {
    return value as null | undefined;
  }

  if (typeof value !== "string") {
    throw new InvalidDispatchUpdatePayloadError("dispatchAt");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchUpdatePayloadError("dispatchAt");
  }

  const parsedDate = new Date(normalized);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new InvalidDispatchUpdatePayloadError("dispatchAt");
  }

  return normalized;
}

function normalizeOptionalQueueIndex(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new InvalidDispatchUpdatePayloadError("queueIndex");
  }

  return value;
}
