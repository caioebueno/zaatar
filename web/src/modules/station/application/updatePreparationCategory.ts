import type { PreparationStepCategory } from "../domain/station.types";
import type { StationRepository } from "../domain/station.repository";

export async function updatePreparationCategoryUseCase(
  repository: StationRepository,
  category: PreparationStepCategory,
) {
  await repository.updatePreparationStepCategory(category);
}
