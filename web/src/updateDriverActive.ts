"use server";

import { updateDriverActiveUseCase } from "@/src/modules/driver/application/updateDriverActive";
import { prismaDriverRepository } from "@/src/modules/driver/infrastructure/prisma/prismaDriverRepository";

type UpdateDriverActiveInput = {
  driverId: string;
  active: boolean;
};

export default async function updateDriverActive(data: UpdateDriverActiveInput) {
  return updateDriverActiveUseCase(
    prismaDriverRepository,
    data.driverId,
    data.active,
  );
}
