"use server";

import { moveDispatchOrderUseCase } from "@/src/modules/dispatch/application/moveDispatchOrder";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";
import type { MoveDispatchOrderInput } from "@/src/modules/dispatch/domain/dispatch.types";

export default async function moveDispatchOrder(data: MoveDispatchOrderInput) {
  return moveDispatchOrderUseCase(prismaDispatchRepository, data);
}
