import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import { BranchNotFoundError } from "../errors/BranchNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../errors/InvalidOnboardingPayloadError.js";
import type { BusinessOnboardingRepository } from "../ports/BusinessOnboardingRepository.js";

export type DeleteOnboardingBranchInput = {
  branchId: string;
  businessId?: string | null;
};

export class DeleteOnboardingBranchUseCase {
  constructor(private readonly repository: BusinessOnboardingRepository) {}

  async execute(input: DeleteOnboardingBranchInput): Promise<void> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const branchId = input.branchId.trim();
    if (!branchId) {
      throw new InvalidOnboardingPayloadError("branchId");
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }

    const removed = await this.repository.removeBranch(businessId, branchId);
    if (!removed) {
      throw new BranchNotFoundError();
    }
  }
}
