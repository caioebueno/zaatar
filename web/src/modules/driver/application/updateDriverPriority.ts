import type { DriverRepository } from "../domain/driver.repository";

function normalizePriorityLevel(priorityLevel: number): number {
  if (!Number.isInteger(priorityLevel) || priorityLevel < 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "priorityLevel",
      },
    };
  }

  return priorityLevel;
}

export async function updateDriverPriorityUseCase(
  repository: DriverRepository,
  driverId: string,
  priorityLevel: number,
) {
  if (driverId.trim().length === 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "driverId",
      },
    };
  }

  return repository.updatePriority({
    driverId,
    priorityLevel: normalizePriorityLevel(priorityLevel),
  });
}
