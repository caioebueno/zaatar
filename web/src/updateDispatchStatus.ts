"use server";

import { updateDispatchStatusUseCase } from "@/src/modules/dispatch/application/updateDispatchStatus";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";
import type { UpdateDispatchStatusInput } from "@/src/modules/dispatch/domain/dispatch.types";

export default async function updateDispatchStatus(data: UpdateDispatchStatusInput) {
  return updateDispatchStatusUseCase(prismaDispatchRepository, data);
}
