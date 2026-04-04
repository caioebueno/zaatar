"use server";

import { markPreparationCategoryAsCompletedUseCase } from "@/src/modules/station/application/markPreparationCategoryAsCompleted";
import { prismaStationRepository } from "@/src/modules/station/infrastructure/prisma/prismaStationRepository";

type TMarkPreparationCategoryAsCompleted = {
  preparationCategoryId: string;
};

const markPreparationCategoryAsCompleted = async (
  data: TMarkPreparationCategoryAsCompleted,
) => {
  await markPreparationCategoryAsCompletedUseCase(
    prismaStationRepository,
    data.preparationCategoryId,
  );
};

export default markPreparationCategoryAsCompleted;
