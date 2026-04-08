import type { DispatchRepository } from "../domain/dispatch.repository";
import type {
  MoveDispatchOrderInput,
  MoveDispatchOrderResult,
} from "../domain/dispatch.types";
import { scheduleDispatchRouteMetricsRefresh } from "./scheduleDispatchRouteMetricsRefresh";

function normalizeTargetIndex(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "targetIndex",
      },
    };
  }

  return value;
}

export async function moveDispatchOrderUseCase(
  repository: DispatchRepository,
  data: MoveDispatchOrderInput,
): Promise<MoveDispatchOrderResult> {
  const orderId = data.orderId.trim();

  if (!orderId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "orderId",
      },
    };
  }

  const createNewDispatch = data.createNewDispatch === true;
  const normalizedTargetDispatchId = data.targetDispatchId?.trim();

  if (
    !createNewDispatch &&
    !normalizedTargetDispatchId &&
    data.targetIndex === undefined
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "body",
      },
    };
  }

  const result = await repository.moveOrder({
    orderId,
    createNewDispatch,
    targetDispatchId: normalizedTargetDispatchId,
    targetIndex: normalizeTargetIndex(data.targetIndex),
  });

  await repository.autoAssignDriver(result.targetDispatchId);
  scheduleDispatchRouteMetricsRefresh(repository, result.targetDispatchId);

  if (
    result.sourceDispatchId &&
    result.sourceDispatchId !== result.targetDispatchId &&
    !result.sourceDispatchDeleted
  ) {
    scheduleDispatchRouteMetricsRefresh(repository, result.sourceDispatchId);
  }

  return result;
}
