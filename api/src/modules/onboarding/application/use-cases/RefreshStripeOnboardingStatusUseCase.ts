import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import type { BusinessOnboardingRepository } from "../ports/BusinessOnboardingRepository.js";
import type { StripeConnectGateway } from "../ports/StripeConnectGateway.js";

export type RefreshStripeOnboardingStatusInput = {
  businessId?: string | null;
};

export type RefreshStripeOnboardingStatusOutput = {
  accountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  readyForPayouts: boolean;
};

export class RefreshStripeOnboardingStatusUseCase {
  constructor(
    private readonly repository: BusinessOnboardingRepository,
    private readonly stripeGateway: StripeConnectGateway,
  ) {}

  async execute(
    input: RefreshStripeOnboardingStatusInput,
  ): Promise<RefreshStripeOnboardingStatusOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }
    const branches = await this.repository.listBranchesByBusinessId(businessId);

    const accountId = business.stripeAccountId?.trim();
    if (!accountId) {
      return {
        accountId: null,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        readyForPayouts: false,
      };
    }

    const status = await this.stripeGateway.fetchConnectedAccountStatus(accountId);
    const readyForPayouts =
      status.detailsSubmitted && status.chargesEnabled && status.payoutsEnabled;

    await this.repository.updateStripeState(businessId, {
      stripeAccountId: status.accountId,
      stripeDetailsSubmitted: status.detailsSubmitted,
      stripeChargesEnabled: status.chargesEnabled,
      stripePayoutsEnabled: status.payoutsEnabled,
      stripeOnboardingCompletedAt: readyForPayouts ? new Date() : null,
      onboardingCompletedAt:
        readyForPayouts && hasBasicInfo(business) && branches.length > 0
          ? new Date()
          : null,
    });

    return {
      accountId: status.accountId,
      detailsSubmitted: status.detailsSubmitted,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      readyForPayouts,
    };
  }
}

function hasBasicInfo(business: {
  bannerPhotoUrl: string | null;
  logoUrl: string | null;
  name: string;
}): boolean {
  return Boolean(business.name.trim() && business.logoUrl?.trim());
}
