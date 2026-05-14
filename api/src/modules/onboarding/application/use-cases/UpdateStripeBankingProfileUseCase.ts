import { BusinessContextRequiredError } from "../errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../errors/BusinessNotFoundError.js";
import { InvalidOnboardingPayloadError } from "../errors/InvalidOnboardingPayloadError.js";
import type { BusinessOnboardingRepository } from "../ports/BusinessOnboardingRepository.js";
import type { StripeConnectGateway } from "../ports/StripeConnectGateway.js";

export type UpdateStripeBankingProfileInput = {
  accountHolderName?: unknown;
  accountHolderType?: unknown;
  accountNumber?: unknown;
  birthDate?: unknown;
  businessId?: string | null;
  country?: unknown;
  currency?: unknown;
  ownerEmail?: string | null;
  ownerName?: string | null;
  routingNumber?: unknown;
  userId: string;
};

export type UpdateStripeBankingProfileOutput = {
  accountId: string;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  readyForPayouts: boolean;
};

export class UpdateStripeBankingProfileUseCase {
  constructor(
    private readonly repository: BusinessOnboardingRepository,
    private readonly stripeGateway: StripeConnectGateway,
  ) {}

  async execute(
    input: UpdateStripeBankingProfileInput,
  ): Promise<UpdateStripeBankingProfileOutput> {
    const businessId = input.businessId?.trim();
    if (!businessId) {
      throw new BusinessContextRequiredError();
    }

    const business = await this.repository.findById(businessId);
    if (!business) {
      throw new BusinessNotFoundError();
    }
    const branches = await this.repository.listBranchesByBusinessId(businessId);

    const ownerName = parseRequiredText(input.ownerName, "ownerName", 120);
    const ownerEmail = parseEmail(input.ownerEmail, "ownerEmail");
    const dob = parseBirthDate(input.birthDate);
    const accountHolderName = parseRequiredText(
      input.accountHolderName,
      "accountHolderName",
      120,
    );
    const accountHolderType = parseAccountHolderType(input.accountHolderType);
    const routingNumber = parseDigits(input.routingNumber, "routingNumber", 9, 9);
    const accountNumber = parseDigits(input.accountNumber, "accountNumber", 4, 17);
    const country = parseCountry(input.country);
    const currency = parseCurrency(input.currency);

    let accountId = business.stripeAccountId?.trim() || null;
    if (!accountId) {
      const connected = await this.stripeGateway.createExpressConnectedAccount({
        businessName: business.name,
        email: ownerEmail,
        metadata: {
          businessId,
          userId: input.userId,
        },
      });
      accountId = connected.accountId;
    }

    const status = await this.stripeGateway.updateConnectedAccountBanking({
      accountId,
      ownerName,
      ownerEmail,
      birthDay: dob.day,
      birthMonth: dob.month,
      birthYear: dob.year,
      accountHolderName,
      accountHolderType,
      routingNumber,
      accountNumber,
      country,
      currency,
    });

    const readyForPayouts =
      status.detailsSubmitted && status.chargesEnabled && status.payoutsEnabled;

    await this.repository.updateStripeState(businessId, {
      stripeAccountId: status.accountId,
      stripeDetailsSubmitted: status.detailsSubmitted,
      stripeChargesEnabled: status.chargesEnabled,
      stripePayoutsEnabled: status.payoutsEnabled,
      stripeOnboardingCompletedAt: readyForPayouts ? new Date() : null,
      onboardingCompletedAt:
        readyForPayouts && hasBasicInfo(business) && branches.length > 0 ? new Date() : null,
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

function parseRequiredText(value: unknown, field: string, maxLen: number): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLen) {
    throw new InvalidOnboardingPayloadError(field);
  }
  return normalized;
}

function parseEmail(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > 254 || !normalized.includes("@")) {
    throw new InvalidOnboardingPayloadError(field);
  }
  return normalized;
}

function parseBirthDate(value: unknown): { day: number; month: number; year: number } {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError("birthDate");
  }
  const normalized = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) {
    throw new InvalidOnboardingPayloadError("birthDate");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new InvalidOnboardingPayloadError("birthDate");
  }

  const now = new Date();
  const minYear = now.getUTCFullYear() - 120;
  const maxYear = now.getUTCFullYear() - 18;
  if (year < minYear || year > maxYear) {
    throw new InvalidOnboardingPayloadError("birthDate");
  }

  return { day, month, year };
}

function parseAccountHolderType(value: unknown): "individual" | "company" {
  if (value !== "individual" && value !== "company") {
    throw new InvalidOnboardingPayloadError("accountHolderType");
  }
  return value;
}

function parseDigits(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError(field);
  }
  const digits = value.replace(/\s+/g, "");
  if (!/^\d+$/.test(digits) || digits.length < minLength || digits.length > maxLength) {
    throw new InvalidOnboardingPayloadError(field);
  }
  return digits;
}

function parseCountry(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError("country");
  }
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new InvalidOnboardingPayloadError("country");
  }
  return normalized;
}

function parseCurrency(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidOnboardingPayloadError("currency");
  }
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(normalized)) {
    throw new InvalidOnboardingPayloadError("currency");
  }
  return normalized;
}

function hasBasicInfo(business: {
  bannerPhotoUrl: string | null;
  logoUrl: string | null;
  name: string;
}): boolean {
  return Boolean(business.name.trim() && business.logoUrl?.trim());
}
