type TStation = {
  id: string;
  name: string;
  preparationSteps: TPreparationStep[];
};

export type TPreparationStep = {
  id: string;
  name: string;
  stationId: string;
  productId: string;
};

export type TPreparationStepTrack = {
  id: string;
  name: string;
  quantity: number;
  completed: boolean;
  preparationStepId: sring;
  preparationStepCategoryId: string;
};

export type TPreparationStepCategory = {
  id: string;
  categoryId: string;
  completed: boolean;
  steps: TPreparationStepTrack[];
};

export default TStation;
