import type TCategory from "@/src/types/category";
import type { TModifierGroupItem } from "@/src/types/product";

export type Station = {
  id: string;
  name: string;
  preparationSteps: PreparationStep[];
};

export type PreparationStep = {
  id: string;
  name: string;
  stationId: string;
  includeModifiers?: boolean;
  includeComments?: boolean;
  productIds: string[];
};

export type PreparationStepTrack = {
  id: string;
  name: string;
  quantity: number;
  completed: boolean;
  comments?: string;
  completedComments: boolean;
  preparationStepModifiers?: PreparationStepModifierTrack[];
  preparationStepId: string;
  preparationStepCategoryId: string;
};

export type PreparationStepModifierTrack = {
  id: string;
  completed: boolean;
  modifierGroupItem: string;
  modifierGtroupItem?: TModifierGroupItem;
};

export type PreparationStepCategory = {
  id: string;
  categoryId: string;
  category?: TCategory;
  completed: boolean;
  orderId: string;
  snoozes: Snooze[];
  steps: PreparationStepTrack[];
};

export type Snooze = {
  startedAt: string;
  duration: number;
  canceled: boolean;
};

export type TStation = Station;
export type TPreparationStep = PreparationStep;
export type TPreparationStepTrack = PreparationStepTrack;
export type TTPreparationStepModifierTrack = PreparationStepModifierTrack;
export type TPreparationStepCategory = PreparationStepCategory;
export type TSnooze = Snooze;
