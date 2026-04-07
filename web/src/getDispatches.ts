"use server";

import { getDispatchesUseCase } from "@/src/modules/dispatch/application/getDispatches";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";

export default async function getDispatches() {
  return getDispatchesUseCase(prismaDispatchRepository);
}
