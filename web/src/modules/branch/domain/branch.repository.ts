import type { BranchWorkingHours, OperationHours } from "./branch.types";

export interface BranchRepository {
  getWorkingHours(branchId: string): Promise<BranchWorkingHours | null>;
  saveWorkingHours(
    branchId: string,
    operationHours: OperationHours,
  ): Promise<BranchWorkingHours>;
}
