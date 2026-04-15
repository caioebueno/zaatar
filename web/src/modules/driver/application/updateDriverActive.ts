import type { DriverRepository } from "../domain/driver.repository";

export async function updateDriverActiveUseCase(
  repository: DriverRepository,
  driverId: string,
  active: boolean,
) {
  const normalizedDriverId = driverId.trim();

  if (!normalizedDriverId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "driverId",
      },
    };
  }

  if (typeof active !== "boolean") {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "active",
      },
    };
  }

  return repository.updateActive({
    driverId: normalizedDriverId,
    active,
  });
}
