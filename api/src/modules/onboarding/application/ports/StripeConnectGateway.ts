export type StripeConnectedAccountStatus = {
  accountId: string;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
};

export type CreateStripeConnectedAccountInput = {
  businessName: string;
  businessUrl?: string | null;
  country?: string;
  email?: string | null;
  metadata?: Record<string, string>;
};

export type CreateStripeOnboardingLinkInput = {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
};

export type UpdateStripeConnectedAccountBankingInput = {
  accountHolderName: string;
  accountHolderType: "individual" | "company";
  accountId: string;
  accountNumber: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  country: string;
  currency: string;
  ownerEmail: string;
  ownerName: string;
  routingNumber: string;
};

export interface StripeConnectGateway {
  createExpressConnectedAccount(
    input: CreateStripeConnectedAccountInput,
  ): Promise<StripeConnectedAccountStatus>;
  updateConnectedAccountBanking(
    input: UpdateStripeConnectedAccountBankingInput,
  ): Promise<StripeConnectedAccountStatus>;
  createOnboardingLink(input: CreateStripeOnboardingLinkInput): Promise<string>;
  fetchConnectedAccountStatus(accountId: string): Promise<StripeConnectedAccountStatus>;
}
