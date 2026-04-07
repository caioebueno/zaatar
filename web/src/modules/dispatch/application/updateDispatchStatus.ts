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

  return repository.updateStatus({
    dispatchId,
    dispatched: data.dispatched,
    dispatchAt: normalizeDispatchAt(data.dispatchAt),
  });
}
