"use server";

import { getBranchWorkingHoursUseCase } from "@/src/modules/branch/application/getBranchWorkingHours";
import { prismaBranchRepository } from "@/src/modules/branch/infrastructure/prisma/prismaBranchRepository";

export default async function getBranchWorkingHours(branchId: string) {
  return getBranchWorkingHoursUseCase(prismaBranchRepository, branchId);
}
