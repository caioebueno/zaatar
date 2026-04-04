import type { BranchRepository } from "../domain/branch.repository";
import type { OperationHours } from "../domain/branch.types";

export async function updateBranchWorkingHoursUseCase(
  repository: BranchRepository,
  branchId: string,
  operationHours: OperationHours,
) {
  return repository.saveWorkingHours(branchId, operationHours);
}
