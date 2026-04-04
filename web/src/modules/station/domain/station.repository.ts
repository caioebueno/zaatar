import type { TOrder } from "@/src/types/order";
import type {
  PreparationStep,
  PreparationStepCategory,
} from "./station.types";

export type DayWindow = {
  start: Date;
  end: Date;
};

export interface StationRepository {
  findPreparationSteps(): Promise<PreparationStep[]>;
  findOrdersByStation(stationId: string, window: DayWindow): Promise<TOrder[]>;
  createPreparationStepCategories(
    categories: PreparationStepCategory[],
  ): Promise<void>;
  updatePreparationStepCategory(
    category: PreparationStepCategory,
  ): Promise<void>;
  markPreparationCategoryAsCompleted(categoryId: string): Promise<void>;
}
