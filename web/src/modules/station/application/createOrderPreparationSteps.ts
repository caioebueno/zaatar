import type { TOrder } from "@/src/types/order";
import { buildPreparationStepCategories } from "../domain/buildPreparationStepCategories";
import type { StationRepository } from "../domain/station.repository";

export async function createOrderPreparationStepsUseCase(
  repository: StationRepository,
  order: TOrder,
) {
  const preparationSteps = await repository.findPreparationSteps();
  const categories = buildPreparationStepCategories(order, preparationSteps);

  await repository.createPreparationStepCategories(categories);
}
