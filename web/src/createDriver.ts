"use server";

import { createDriverUseCase } from "@/src/modules/driver/application/createDriver";
import { prismaDriverRepository } from "@/src/modules/driver/infrastructure/prisma/prismaDriverRepository";
import type { TCreateDriverInput } from "@/src/types/driver";

export default async function createDriver(data: TCreateDriverInput) {
  return createDriverUseCase(prismaDriverRepository, data);
}
