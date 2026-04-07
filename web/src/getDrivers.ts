"use server";

import { getDriversUseCase } from "@/src/modules/driver/application/getDrivers";
import { prismaDriverRepository } from "@/src/modules/driver/infrastructure/prisma/prismaDriverRepository";

export default async function getDrivers() {
  return getDriversUseCase(prismaDriverRepository);
}
