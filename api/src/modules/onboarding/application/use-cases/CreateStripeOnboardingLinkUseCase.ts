import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../errors/InvalidOnboardingPayloadError.js";
import type { BusinessOnboardingRepository } from "../ports/BusinessOnboardingRepository.js";
import type { StripeConnectGateway } from "../ports/StripeConnectGateway.js";

export type CreateStripeOnboardingLinkInput = {
  businessId?: string | null;
  ownerEmail?: string | null;
  refreshUrl: unknown;
  returnUrl: unknown;
  userId: string;
};

export type CreateStripeOnboardingLinkOutput = {
  accountId: string;
  onboardingUrl: string;
};

export class CreateStripeOnboardingLinkUseCase {
  constructor(
    private readonly repository: BusinessOnboardingRepository,
    private readonly stripeGateway: StripeConnectGateway,
  ) {}

  async execute(
    input: CreateStripeOnboardingLinkInput,
  ): Promise<CreateStripeOnboardingLinkOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }
    const branches = await this.repository.listBranchesByBusinessId(businessId);

    const refreshUrl = parseRequiredUrl(input.refreshUrl, "refreshUrl");
    const returnUrl = parseRequiredUrl(input.returnUrl, "returnUrl");

    let accountId = business.stripeAccountId?.trim() || null;
    if (!accountId) {
      const connected = await this.stripeGateway.createExpressConnectedAccount({
        businessName: business.name,
        email: input.ownerEmail ?? null,
        metadata: {
          businessId,
          userId: input.userId,
        },
      });
      accountId = connected.accountId;

      const ready =
        connected.detailsSubmitted &&
        connected.chargesEnabled &&
        connected.payoutsEnabled;

      await this.repository.updateStripeState(businessId, {
        stripeAccountId: connected.accountId,
        stripeDetailsSubmitted: connected.detailsSubmitted,
        stripeChargesEnabled: connected.chargesEnabled,
        stripePayoutsEnabled: connected.payoutsEnabled,
        stripeOnboardingCompletedAt: ready ? new Date() : null,
        onboardingCompletedAt:
          ready && hasBasicInfo(business) && branches.length > 0 ? new Date() : null,
      });
    }

    const onboardingUrl = await this.stripeGateway.createOnboardingLink({
      accountId,
      refreshUrl,
      returnUrl,
    });

    return {
      accountId,
      onboardingUrl,
    };
  }
}

function parseRequiredUrl(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidOnboardingPayloadError(field);
  }
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new InvalidOnboardingPayloadError(field);
    }
    return normalized;
  } catch {
    throw new InvalidOnboardingPayloadError(field);
  }
}

function hasBasicInfo(business: {
  bannerPhotoUrl: string | null;
  logoUrl: string | null;
  name: string;
}): boolean {
  return Boolean(business.name.trim() && business.logoUrl?.trim());
}
