"use server";

import { updatePreparationCategoryUseCase } from "@/src/modules/station/application/updatePreparationCategory";
import type { TPreparationStepCategory } from "@/src/types/station";
import { prismaStationRepository } from "@/src/modules/station/infrastructure/prisma/prismaStationRepository";

const updatePreparationCategory = async (category: TPreparationStepCategory) => {
  await updatePreparationCategoryUseCase(prismaStationRepository, category);
};

export default updatePreparationCategory;
