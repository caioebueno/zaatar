import type { DispatchRepository } from "../domain/dispatch.repository";
import type { UpdateDispatchStatusInput } from "../domain/dispatch.types";

function normalizeDispatchAt(dispatchAt: string | null | undefined) {
  if (dispatchAt === undefined || dispatchAt === null) {
    return dispatchAt;
  }

  const normalizedDispatchAt = dispatchAt.trim();

  if (!normalizedDispatchAt) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "dispatchAt",
      },
    };
  }

  const parsedDispatchAt = new Date(normalizedDispatchAt);

  if (Number.isNaN(parsedDispatchAt.getTime())) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "dispatchAt",
      },
    };
  }

  return normalizedDispatchAt;
}

function normalizeDriverId(driverId: string | null | undefined) {
  if (driverId === undefined || driverId === null) {
    return driverId;
  }

  const normalizedDriverId = driverId.trim();

  if (!normalizedDriverId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "driverId",
      },
    };
  }

  return normalizedDriverId;
}

function normalizeQueueIndex(queueIndex: number | undefined) {
  if (queueIndex === undefined) {
    return undefined;
  }

  if (
    !Number.isFinite(queueIndex) ||
    !Number.isInteger(queueIndex) ||
    queueIndex < 1
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "queueIndex",
      },
    };
  }

  return queueIndex;
}

export async function updateDispatchStatusUseCase(
  repository: DispatchRepository,
  data: UpdateDispatchStatusInput,
) {
  const dispatchId = data.dispatchId.trim();

  if (!dispatchId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "dispatchId",
      },
    };
  }

  if (
    data.dispatched === undefined &&
    data.driverId === undefined &&
    data.queueIndex === undefined
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "body",
      },
    };
  }

  if (data.dispatchAt !== undefined && data.dispatched === undefined) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "dispatched",
      },
    };
  }

  return repository.updateStatus({
    dispatchId,
    dispatched: data.dispatched,
    dispatchAt: normalizeDispatchAt(data.dispatchAt),
    driverId: normalizeDriverId(data.driverId),
    queueIndex: normalizeQueueIndex(data.queueIndex),
  });
}
