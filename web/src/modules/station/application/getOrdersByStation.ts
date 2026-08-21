import type { StationRepository } from "../domain/station.repository";

function buildRecentWindow(referenceDate: Date) {
  return {
    start: new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000),
    end: referenceDate,
  };
}

export async function getOrdersByStationUseCase(
  repository: StationRepository,
  stationId: string,
) {
  return repository.findOrdersByStation(stationId, buildRecentWindow(new Date()));
}
