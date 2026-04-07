import type { DispatchRepository } from "../domain/dispatch.repository";

export async function getNextDispatchForDriverUseCase(
  repository: DispatchRepository,
  driverId: string,
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

  return repository.findNextForDriver(normalizedDriverId);
}
