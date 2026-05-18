import { InvalidDispatchUpdatePayloadError } from "../errors/InvalidDispatchUpdatePayloadError.js";
import type {
  DispatchRepository,
  MoveDispatchOrderResult,
} from "../ports/DispatchRepository.js";

export type MoveDispatchOrderInput = {
  createNewDispatch?: unknown;
  orderId: unknown;
  targetDispatchId?: unknown;
  targetIndex?: unknown;
};

export class MoveDispatchOrderUseCase {
  constructor(private readonly dispatchRepository: DispatchRepository) {}

  async execute(input: MoveDispatchOrderInput): Promise<MoveDispatchOrderResult> {
    const orderId = normalizeRequiredString(input.orderId, "orderId");
    const createNewDispatch = normalizeOptionalBoolean(
      input.createNewDispatch,
      "createNewDispatch",
    );
    const targetDispatchId = normalizeOptionalString(
      input.targetDispatchId,
      "targetDispatchId",
    );
    const targetIndex = normalizeOptionalTargetIndex(input.targetIndex);

    if (
      createNewDispatch !== true &&
      targetDispatchId === undefined &&
      targetIndex === undefined
    ) {
      throw new InvalidDispatchUpdatePayloadError("body");
    }

    return this.dispatchRepository.moveOrder({
      orderId,
      createNewDispatch: createNewDispatch === true,
      targetDispatchId,
      targetIndex,
    });
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

function normalizeOptionalString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return normalizeRequiredString(value, field);
}

function normalizeOptionalBoolean(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new InvalidDispatchUpdatePayloadError(field);
  }

  return value;
}

function normalizeOptionalTargetIndex(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    throw new InvalidDispatchUpdatePayloadError("targetIndex");
  }

  return value;
}
