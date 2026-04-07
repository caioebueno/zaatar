"use server";

import { createDispatchUseCase } from "@/src/modules/dispatch/application/createDispatch";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";
import type { CreateDispatchInput } from "@/src/modules/dispatch/domain/dispatch.types";

export default async function createDispatch(data: CreateDispatchInput) {
  return createDispatchUseCase(prismaDispatchRepository, data);
}
