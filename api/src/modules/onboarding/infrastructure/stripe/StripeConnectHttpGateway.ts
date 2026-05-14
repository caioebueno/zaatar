import { StripeNotConfiguredError } from "../../application/errors/StripeNotConfiguredError.js";
import { StripeRequestFailedError } from "../../application/errors/StripeRequestFailedError.js";
import type {
  CreateStripeConnectedAccountInput,
  CreateStripeOnboardingLinkInput,
  StripeConnectedAccountStatus,
  StripeConnectGateway,
  UpdateStripeConnectedAccountBankingInput,
} from "../../application/ports/StripeConnectGateway.js";

type StripeCreateAccountResponse = {
  id?: string;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  error?: { message?: string };
};

type StripeCreateAccountLinkResponse = {
  error?: { message?: string };
  url?: string;
};

type StripeRetrieveAccountResponse = {
  charges_enabled?: boolean;
  details_submitted?: boolean;
  error?: { message?: string };
  id?: string;
  payouts_enabled?: boolean;
};

export class StripeConnectHttpGateway implements StripeConnectGateway {
  private readonly apiBaseUrl: string;
  private readonly secretKey: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!secretKey) {
      throw new StripeNotConfiguredError();
    }
    this.secretKey = secretKey;
    this.apiBaseUrl = "https://api.stripe.com/v1";
  }

  async createExpressConnectedAccount(
    input: CreateStripeConnectedAccountInput,
  ): Promise<StripeConnectedAccountStatus> {
    const body = new URLSearchParams();
    body.set("type", "express");
    body.set("country", (input.country?.trim() || "US").toUpperCase());
    body.set("business_profile[name]", input.businessName);
    body.set("capabilities[card_payments][requested]", "true");
    body.set("capabilities[transfers][requested]", "true");
    if (input.email?.trim()) {
      body.set("email", input.email.trim());
    }
    if (input.businessUrl?.trim()) {
      body.set("business_profile[url]", input.businessUrl.trim());
    }

    if (input.metadata) {
      for (const [key, value] of Object.entries(input.metadata)) {
        if (!key.trim() || !value.trim()) continue;
        body.set(`metadata[${key.trim()}]`, value.trim());
      }
    }

    const payload = await this.request<StripeCreateAccountResponse>(
      "/accounts",
      "POST",
      body,
    );

    const accountId = payload.id?.trim();
    if (!accountId) {
      throw new StripeRequestFailedError(502, "STRIPE_ACCOUNT_CREATE_FAILED");
    }

    return {
      accountId,
      detailsSubmitted: Boolean(payload.details_submitted),
      chargesEnabled: Boolean(payload.charges_enabled),
      payoutsEnabled: Boolean(payload.payouts_enabled),
    };
  }

  async createOnboardingLink(input: CreateStripeOnboardingLinkInput): Promise<string> {
    const body = new URLSearchParams();
    body.set("account", input.accountId);
    body.set("type", "account_onboarding");
    body.set("refresh_url", input.refreshUrl);
    body.set("return_url", input.returnUrl);
    body.set("collection_options[fields]", "eventually_due");

    const payload = await this.request<StripeCreateAccountLinkResponse>(
      "/account_links",
      "POST",
      body,
    );

    const url = payload.url?.trim();
    if (!url) {
      throw new StripeRequestFailedError(502, "STRIPE_ACCOUNT_LINK_CREATE_FAILED");
    }

    return url;
  }

  async updateConnectedAccountBanking(
    input: UpdateStripeConnectedAccountBankingInput,
  ): Promise<StripeConnectedAccountStatus> {
    const [firstName, ...restName] = input.ownerName.trim().split(/\s+/g);
    const lastName = restName.join(" ").trim() || "Owner";

    const accountBody = new URLSearchParams();
    accountBody.set("business_type", "individual");
    accountBody.set("individual[first_name]", firstName || "Owner");
    accountBody.set("individual[last_name]", lastName);
    accountBody.set("individual[email]", input.ownerEmail);
    accountBody.set("individual[dob][day]", String(input.birthDay));
    accountBody.set("individual[dob][month]", String(input.birthMonth));
    accountBody.set("individual[dob][year]", String(input.birthYear));

    await this.request<StripeCreateAccountResponse>(
      `/accounts/${encodeURIComponent(input.accountId)}`,
      "POST",
      accountBody,
    );

    const bankBody = new URLSearchParams();
    bankBody.set("external_account[object]", "bank_account");
    bankBody.set("external_account[country]", input.country);
    bankBody.set("external_account[currency]", input.currency);
    bankBody.set("external_account[account_holder_name]", input.accountHolderName);
    bankBody.set("external_account[account_holder_type]", input.accountHolderType);
    bankBody.set("external_account[routing_number]", input.routingNumber);
    bankBody.set("external_account[account_number]", input.accountNumber);
    bankBody.set("default_for_currency", "true");

    await this.request<Record<string, unknown>>(
      `/accounts/${encodeURIComponent(input.accountId)}/external_accounts`,
      "POST",
      bankBody,
    );

    return this.fetchConnectedAccountStatus(input.accountId);
  }

  async fetchConnectedAccountStatus(accountId: string): Promise<StripeConnectedAccountStatus> {
    const payload = await this.request<StripeRetrieveAccountResponse>(
      `/accounts/${encodeURIComponent(accountId)}`,
      "GET",
    );

    const resolvedAccountId = payload.id?.trim() || accountId;
    return {
      accountId: resolvedAccountId,
      detailsSubmitted: Boolean(payload.details_submitted),
      chargesEnabled: Boolean(payload.charges_enabled),
      payoutsEnabled: Boolean(payload.payouts_enabled),
    };
  }

  private async request<T>(
    path: string,
    method: "GET" | "POST",
    body?: URLSearchParams,
  ): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: body?.toString(),
    });

    const payload = (await response.json().catch(() => ({}))) as T & {
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new StripeRequestFailedError(
        response.status,
        payload.error?.message || "STRIPE_REQUEST_FAILED",
      );
    }

    return payload;
  }
}
