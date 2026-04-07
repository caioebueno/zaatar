import type { DriverRepository } from "../domain/driver.repository";
import type { CreateDriverInput } from "../domain/driver.types";

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

export async function createDriverUseCase(
  repository: DriverRepository,
  data: CreateDriverInput,
) {
  const name = data.name.trim();

  if (name.length === 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "name",
      },
    };
  }

  return repository.create({
    name,
    ...(typeof data.active === "boolean" ? { active: data.active } : {}),
    priorityLevel: normalizePriorityLevel(data.priorityLevel),
  });
}
