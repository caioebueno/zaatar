"use server";

import { updateDriverPriorityUseCase } from "@/src/modules/driver/application/updateDriverPriority";
import { prismaDriverRepository } from "@/src/modules/driver/infrastructure/prisma/prismaDriverRepository";

type UpdateDriverPriorityInput = {
  driverId: string;
  priorityLevel: number;
};

export default async function updateDriverPriority(
  data: UpdateDriverPriorityInput,
) {
  return updateDriverPriorityUseCase(
    prismaDriverRepository,
    data.driverId,
    data.priorityLevel,
  );
}
