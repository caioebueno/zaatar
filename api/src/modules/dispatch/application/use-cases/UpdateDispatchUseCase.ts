import { InvalidDispatchUpdatePayloadError } from "../errors/InvalidDispatchUpdatePayloadError.js";
import type {
  DispatchEntity,
  DispatchRepository,
  UpdateDispatchStatusInput,
} from "../ports/DispatchRepository.js";
import type { OutForDeliveryNotifier } from "../ports/OutForDeliveryNotifier.js";

export type UpdateDispatchInput = {
  completedAt?: unknown;
  dispatchAt?: unknown;
  dispatched?: unknown;
  dispatchId: unknown;
  driverId?: unknown;
  queueIndex?: unknown;
};

export class UpdateDispatchUseCase {
  constructor(
    private readonly dispatchRepository: DispatchRepository,
    private readonly outForDeliveryNotifier?: OutForDeliveryNotifier,
  ) {}

  async execute(input: UpdateDispatchInput): Promise<DispatchEntity> {
    const dispatchId = normalizeRequiredString(input.dispatchId, "dispatchId");
    const completedAt = normalizeOptionalDate(input.completedAt, "completedAt");
    const dispatched = normalizeOptionalBoolean(input.dispatched, "dispatched");
    const dispatchAt = normalizeOptionalDate(input.dispatchAt, "dispatchAt");
    const driverId = normalizeOptionalNullableString(input.driverId, "driverId");
    const queueIndex = normalizeOptionalQueueIndex(input.queueIndex);

    if (
      completedAt === undefined &&
      dispatched === undefined &&
      driverId === undefined &&
      queueIndex === undefined
    ) {
      throw new InvalidDispatchUpdatePayloadError("body");
    }

    if (dispatchAt !== undefined && dispatched === undefined) {
      throw new InvalidDispatchUpdatePayloadError("dispatched");
    }

    const updatedDispatch = await this.dispatchRepository.updateStatus({
      dispatchId,
      completedAt,
      dispatched,
      dispatchAt,
      driverId,
      queueIndex,
    } satisfies UpdateDispatchStatusInput);

    if (
      dispatched === true &&
      updatedDispatch.dispatchAt &&
      this.outForDeliveryNotifier
    ) {
      void this.outForDeliveryNotifier
        .sendForDispatch(updatedDispatch)
        .catch((error: unknown) => {
          console.error(
            "Failed to send out_for_delivery WhatsApp notifications:",
            error,
          );
        });
    }

    return updatedDispatch;
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

function normalizeOptionalDate(
  value: unknown,
  field: "completedAt" | "dispatchAt",
): string | null | undefined {
  if (value === undefined || value === null) {
    return value as null | undefined;
  }

  if (typeof value !== "string") {
    throw new InvalidDispatchUpdatePayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDispatchUpdatePayloadError(field);
  }

  const parsedDate = new Date(normalized);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new InvalidDispatchUpdatePayloadError(field);
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
