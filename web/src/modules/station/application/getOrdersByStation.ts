import type { StationRepository } from "../domain/station.repository";

function buildDayWindow(referenceDate: Date) {
  return {
    start: new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      0,
      0,
      0,
      0,
    ),
    end: new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate() + 1,
      0,
      0,
      0,
      0,
    ),
  };
}

export async function getOrdersByStationUseCase(
  repository: StationRepository,
  stationId: string,
) {
  return repository.findOrdersByStation(stationId, buildDayWindow(new Date()));
}
