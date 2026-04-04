"use server";

import { updateBranchWorkingHoursUseCase } from "@/src/modules/branch/application/updateBranchWorkingHours";
import { prismaBranchRepository } from "@/src/modules/branch/infrastructure/prisma/prismaBranchRepository";
import type { TOperationHours } from "@/src/types/operationHours";

type UpdateBranchWorkingHoursInput = {
  branchId: string;
  operationHours: TOperationHours;
};

export default async function updateBranchWorkingHours(
  data: UpdateBranchWorkingHoursInput,
) {
  return updateBranchWorkingHoursUseCase(
    prismaBranchRepository,
    data.branchId,
    data.operationHours,
  );
}
