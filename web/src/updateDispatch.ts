"use server";

import { updateDispatchUseCase } from "@/src/modules/dispatch/application/updateDispatch";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";
import type { UpdateDispatchInput } from "@/src/modules/dispatch/domain/dispatch.types";

export default async function updateDispatch(data: UpdateDispatchInput) {
  return updateDispatchUseCase(prismaDispatchRepository, data);
}
