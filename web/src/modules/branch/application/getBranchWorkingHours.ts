import type { BranchRepository } from "../domain/branch.repository";

export async function getBranchWorkingHoursUseCase(
  repository: BranchRepository,
  branchId: string,
) {
  const branchWorkingHours = await repository.getWorkingHours(branchId);

  if (!branchWorkingHours) {
    throw {
      code: "NOT_FOUND",
      details: {
        service: "BRANCH",
        id: branchId,
      },
    };
  }

  return branchWorkingHours;
}
