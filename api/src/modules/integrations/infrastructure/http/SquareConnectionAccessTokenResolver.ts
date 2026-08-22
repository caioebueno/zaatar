import type {
  SaveSquareConnectionInput,
  SquareConnectionRepository,
  SquareConnectionView,
} from "../../application/ports/SquareConnectionRepository.js";

type SquareOAuthTokenResponse = {
  access_token?: string;
  errors?: Array<{
    category?: string;
    code?: string;
    detail?: string;
  }>;
  expires_at?: string;
  merchant_id?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  [key: string]: unknown;
};

const DEFAULT_SQUARE_VERSION = "2026-07-15";
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export class SquareConnectionAccessTokenResolver {
  constructor(
    private readonly repository: SquareConnectionRepository,
  ) {}

  async resolveForBusiness(businessId: string): Promise<string> {
    const connection = await this.repository.findByBusinessIdWithSecrets(businessId);
    if (!connection) {
      throw new Error("SQUARE_NOT_CONNECTED");
    }

    return this.resolveConnectionAccessToken(connection);
  }

  async resolveForMerchantId(merchantId: string): Promise<string> {
    const connection = await this.repository.findByMerchantIdWithSecrets(merchantId);
    if (!connection) {
      throw new Error("SQUARE_NOT_CONNECTED");
    }

    return this.resolveConnectionAccessToken(connection);
  }

  private async resolveConnectionAccessToken(
    connection: SquareConnectionView,
  ): Promise<string> {
    const accessToken = connection.accessToken?.trim() ?? "";
    if (!accessToken) {
      throw new Error("SQUARE_ACCESS_TOKEN_MISSING");
    }

    if (!shouldRefreshConnection(connection)) {
      return accessToken;
    }

    const refreshed = await refreshSquareConnectionTokens(connection);
    const saved = await this.repository.save({
      accessToken: refreshed.accessToken,
      businessId: connection.businessId,
      environment: connection.environment,
      expiresAt: refreshed.expiresAt,
      merchantId: refreshed.merchantId,
      rawPayload: refreshed.rawPayload,
      refreshToken: refreshed.refreshToken,
      scope: refreshed.scope,
      tokenType: refreshed.tokenType,
      userId: connection.userId,
    });

    return saved.accessToken?.trim() ?? refreshed.accessToken;
  }
}

function shouldRefreshConnection(connection: SquareConnectionView): boolean {
  const refreshToken = connection.refreshToken?.trim() ?? "";
  if (!refreshToken) {
    return false;
  }

  if (!connection.expiresAt) {
    return false;
  }

  return connection.expiresAt.getTime() - Date.now() <= REFRESH_WINDOW_MS;
}

async function refreshSquareConnectionTokens(
  connection: SquareConnectionView,
): Promise<SaveSquareConnectionInput> {
  const clientId = process.env.SQUARE_APPLICATION_ID?.trim();
  const clientSecret = process.env.SQUARE_APPLICATION_SECRET?.trim();
  const refreshToken = connection.refreshToken?.trim() ?? "";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("SQUARE_OAUTH_CREDENTIALS_NOT_CONFIGURED");
  }

  const response = await fetch(`${resolveSquareOauthBaseUrl()}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": process.env.SQUARE_API_VERSION?.trim() || DEFAULT_SQUARE_VERSION,
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as SquareOAuthTokenResponse;

  if (!response.ok) {
    const detail = payload.errors?.[0]?.detail?.trim();
    throw new Error(
      detail
        ? `SQUARE_TOKEN_REFRESH_FAILED_${response.status}: ${detail}`
        : `SQUARE_TOKEN_REFRESH_FAILED_${response.status}`,
    );
  }

  const accessToken = payload.access_token?.trim() ?? "";
  if (!accessToken) {
    throw new Error("SQUARE_TOKEN_REFRESH_FAILED_MISSING_ACCESS_TOKEN");
  }

  return {
    accessToken,
    businessId: connection.businessId,
    environment: connection.environment,
    expiresAt: parseDateOrNull(payload.expires_at),
    merchantId: payload.merchant_id?.trim() || connection.merchantId,
    rawPayload: {
      ...(isRecord(connection.rawPayload) ? connection.rawPayload : {}),
      tokenResponse: payload,
      lastRefreshedAt: new Date().toISOString(),
    },
    refreshToken: payload.refresh_token?.trim() || refreshToken,
    scope: payload.scope?.trim() || connection.scope,
    tokenType: payload.token_type?.trim() || connection.tokenType || null,
    userId: connection.userId,
  };
}

function parseDateOrNull(value: string | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveSquareOauthBaseUrl(): string {
  const configured = process.env.SQUARE_OAUTH_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const environment = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return environment === "PRODUCTION"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}
