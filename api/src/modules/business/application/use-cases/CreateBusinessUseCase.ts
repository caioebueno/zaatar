import { randomUUID } from "node:crypto";
import { InvalidBusinessPayloadError } from "../errors/InvalidBusinessPayloadError.js";
import type {
  BusinessRecord,
  BusinessRepository,
  CreateOwnedBusinessInput,
} from "../ports/BusinessRepository.js";
import type { StripeConnectGateway } from "../../../onboarding/application/ports/StripeConnectGateway.js";

export type CreateBusinessInput = {
  logoUrl: unknown;
  name: unknown;
  ownerEmail?: string | null;
  userId: string;
};

export type CreateBusinessOutput = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  businessId: string;
  logoUrl: string | null;
  name: string;
};

export class CreateBusinessUseCase {
  constructor(
    private readonly repository: BusinessRepository,
    private readonly stripeGateway: StripeConnectGateway,
  ) {}

  async execute(input: CreateBusinessInput): Promise<CreateBusinessOutput> {
    const businessId = randomUUID();
    const businessName = normalizeName(input.name);
    const ownerEmail = normalizeOptionalEmail(input.ownerEmail);
    const connected = await this.stripeGateway.createExpressConnectedAccount({
      businessName,
      email: ownerEmail,
      metadata: {
        businessId,
        userId: input.userId,
      },
    });
    const stripeReady =
      connected.detailsSubmitted && connected.chargesEnabled && connected.payoutsEnabled;

    const next: CreateOwnedBusinessInput = {
      id: businessId,
      userId: input.userId,
      name: businessName,
      logoUrl: normalizeLogoUrl(input.logoUrl),
      stripeAccountId: connected.accountId,
      stripeDetailsSubmitted: connected.detailsSubmitted,
      stripeChargesEnabled: connected.chargesEnabled,
      stripePayoutsEnabled: connected.payoutsEnabled,
      stripeOnboardingCompletedAt: stripeReady ? new Date() : null,
    };

    const business = await this.repository.createOwnedBusiness(next);
    return mapBusinessOutput(business);
  }
}

function normalizeName(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidBusinessPayloadError("name");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidBusinessPayloadError("name");
  }

  if (normalized.length > 120) {
    throw new InvalidBusinessPayloadError("name");
  }

  return normalized;
}

function normalizeOptionalEmail(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!normalized) return null;
  try {
    const parsed = new URL(`mailto:${normalized}`);
    if (parsed.protocol !== "mailto:") return null;
    return normalized;
  } catch {
    return null;
  }
}

function normalizeLogoUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidBusinessPayloadError("logoUrl");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidBusinessPayloadError("logoUrl");
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new InvalidBusinessPayloadError("logoUrl");
    }
  } catch {
    throw new InvalidBusinessPayloadError("logoUrl");
  }

  return normalized;
}

function mapBusinessOutput(record: BusinessRecord): CreateBusinessOutput {
  return {
    businessId: record.id,
    name: record.name,
    logoUrl: record.logoUrl,
    bannerPhotoUrl: record.bannerPhotoUrl,
    brandColor: record.brandColor,
  };
}
