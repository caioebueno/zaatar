import type { StationRepository } from "../domain/station.repository";

export async function markPreparationCategoryAsCompletedUseCase(
  repository: StationRepository,
  preparationCategoryId: string,
) {
  await repository.markPreparationCategoryAsCompleted(preparationCategoryId);
}
