"use server";

import { getNextDispatchForDriverUseCase } from "@/src/modules/dispatch/application/getNextDispatchForDriver";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";

export default async function getNextDispatchForDriver(driverId: string) {
  return getNextDispatchForDriverUseCase(prismaDispatchRepository, driverId);
}
