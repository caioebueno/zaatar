import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { resolveManagerTokenSecret } from "../../../owner/infrastructure/security/tokenConfig.js";
import type { SquareConnectionRepository } from "../../application/ports/SquareConnectionRepository.js";
import type {
  SquareLocationSummary,
  SquareOrdersGateway,
} from "../../application/ports/SquareOrdersGateway.js";
import type { PublishSquareMenusOutput } from "../../application/use-cases/PublishSquareMenusUseCase.js";
import type { PublishSquareMenusUseCase } from "../../application/use-cases/PublishSquareMenusUseCase.js";
import { resolveSquareConnectionEnvironment } from "../../infrastructure/prisma/PrismaSquareConnectionRepository.js";

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

type SignedSquareOauthStatePayload = {
  businessId: string;
  clientState: string | null;
  exp: number;
  iat: number;
  redirectUri: string;
  returnTo: string | null;
  userId: string;
};

type SquareExchangeSuccess = {
  connected: true;
  connection: {
    businessId: string;
    connectedAt: string;
    environment: string;
    expiresAt: string | null;
    id: string;
    merchantId: string | null;
    scope: string | null;
    updatedAt: string;
  };
  locations: SquareLocationSummary[];
  menuSync: PublishSquareMenusOutput;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSquareOauthScopes(): string[] {
  const configured = process.env.SQUARE_OAUTH_SCOPES?.trim();
  if (!configured) {
    return [
      "ITEMS_READ",
      "ITEMS_WRITE",
      "ORDERS_READ",
      "ORDERS_WRITE",
      "CUSTOMERS_READ",
      "MERCHANT_PROFILE_READ",
    ];
  }

  return configured
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
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

function parseDateOrNull(value: string | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function extractPersistedLocations(rawPayload: unknown): Array<{
  id: string;
  name: string | null;
  status: string | null;
  timezone: string | null;
}> {
  if (!isRecord(rawPayload)) return [];
  const snapshot = rawPayload.locationsSnapshot;
  if (!Array.isArray(snapshot)) return [];

  return snapshot
    .map((item) => {
      if (!isRecord(item)) return null;
      const id = typeof item.id === "string" ? item.id.trim() : "";
      if (!id) return null;
      return {
        id,
        name: typeof item.name === "string" ? item.name : null,
        status: typeof item.status === "string" ? item.status : null,
        timezone: typeof item.timezone === "string" ? item.timezone : null,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        name: string | null;
        status: string | null;
        timezone: string | null;
      } => item !== null,
    );
}

export class SquareOAuthController implements HttpController {
  constructor(
    private readonly repository: SquareConnectionRepository,
    private readonly squareOrdersGateway: SquareOrdersGateway,
    private readonly publishSquareMenusUseCase: PublishSquareMenusUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    if (
      request.method === "GET" &&
      (pathname === "/integrations/square/oauth/exchange" ||
        pathname === "/integrations/square/oauth/callback")
    ) {
      return this.handleOauthCallback(request, url);
    }

    const userId = request.auth?.userId;
    const businessId = request.auth?.businessId?.trim() ?? "";

    if (!userId) {
      return {
        statusCode: 401,
        body: { error: "Unauthorized" },
      };
    }

    if (!businessId) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "businessId" },
      };
    }

    if (request.method === "GET" && pathname === "/integrations/square/connection") {
      const connection = await this.repository.findByBusinessId(businessId);

      return {
        statusCode: 200,
        body: {
          connected: Boolean(connection),
          locations: connection ? extractPersistedLocations(connection.rawPayload) : [],
          connection: connection
            ? {
                id: connection.id,
                businessId: connection.businessId,
                merchantId: connection.merchantId,
                environment: connection.environment,
                scope: connection.scope,
                expiresAt: connection.expiresAt?.toISOString() ?? null,
                connectedAt: connection.connectedAt.toISOString(),
                updatedAt: connection.updatedAt.toISOString(),
              }
            : null,
        },
      };
    }

    if (request.method === "GET" && pathname === "/integrations/square/oauth/url") {
      const clientId = process.env.SQUARE_APPLICATION_ID?.trim();
      if (!clientId) {
        return {
          statusCode: 500,
          body: { error: "SQUARE_APPLICATION_ID is not configured" },
        };
      }

      const requestOrigin = resolveRequestOrigin(request.headers);
      const redirectUri =
        normalizeOptionalString(url.searchParams.get("redirectUri")) ??
        resolveDefaultOauthRedirectUri(requestOrigin);

      if (!redirectUri) {
        return {
          statusCode: 400,
          body: {
            error: "redirectUri is required",
            reason: "SQUARE_OAUTH_REDIRECT_URI_REQUIRED",
          },
        };
      }

      const authorizationUrl = new URL("/oauth2/authorize", resolveSquareOauthBaseUrl());
      authorizationUrl.searchParams.set("client_id", clientId);
      authorizationUrl.searchParams.set("scope", getSquareOauthScopes().join(" "));
      authorizationUrl.searchParams.set("redirect_uri", redirectUri);
      if (resolveSquareConnectionEnvironment() === "PRODUCTION") {
        authorizationUrl.searchParams.set("session", "false");
      }

      const returnTo = normalizeRedirectTarget(
        url.searchParams.get("returnTo"),
        requestOrigin,
      );
      const clientState = normalizeOptionalString(url.searchParams.get("state"));
      authorizationUrl.searchParams.set(
        "state",
        signSquareOauthState({
          businessId,
          clientState,
          redirectUri,
          returnTo,
          userId,
        }),
      );

      return {
        statusCode: 200,
        body: {
          authorizationUrl: authorizationUrl.toString(),
          callbackPath: "/integrations/square/oauth/exchange",
          redirectUri,
          returnTo,
          scope: getSquareOauthScopes(),
        },
      };
    }

    if (request.method === "POST" && pathname === "/integrations/square/oauth/exchange") {
      if (!isRecord(request.body)) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload" },
        };
      }

      const code =
        typeof request.body.code === "string" ? request.body.code.trim() : "";
      const redirectUri =
        typeof request.body.redirectUri === "string"
          ? request.body.redirectUri.trim()
          : "";

      if (!code || !redirectUri) {
        return {
          statusCode: 400,
          body: { error: "code and redirectUri are required" },
        };
      }

      const result = await this.exchangeAuthorizationCode({
        businessId,
        code,
        redirectUri,
        userId,
      });

      return {
        statusCode: 200,
        body: result,
      };
    }

    if (request.method === "DELETE" && pathname === "/integrations/square/connection") {
      const connection = await this.repository.findByBusinessIdWithSecrets(businessId);
      if (!connection) {
        return {
          statusCode: 404,
          body: { error: "SQUARE_NOT_CONNECTED" },
        };
      }

      await revokeSquareConnection(connection.accessToken?.trim() ?? "", connection.merchantId);
      await this.repository.deleteByBusinessId(businessId);

      return {
        statusCode: 200,
        body: { ok: true },
      };
    }

    return {
      statusCode: 404,
      body: { error: "Not found" },
    };
  }

  private async handleOauthCallback(
    request: HttpRequest,
    url: URL,
  ): Promise<HttpResponse> {
    const signedState = normalizeOptionalString(url.searchParams.get("state"));
    const callbackState = signedState ? verifySquareOauthState(signedState) : null;

    if (!callbackState) {
      return renderOauthCallbackError(
        400,
        null,
        "SQUARE_OAUTH_STATE_INVALID",
        "Square OAuth state is missing or invalid.",
      );
    }

    const squareError = normalizeOptionalString(url.searchParams.get("error"));
    const squareErrorDescription =
      normalizeOptionalString(url.searchParams.get("error_description")) ??
      normalizeOptionalString(url.searchParams.get("errorDescription"));

    if (squareError) {
      return renderOauthCallbackError(
        400,
        callbackState.returnTo,
        squareError,
        squareErrorDescription ?? "Square returned an authorization error.",
        callbackState.clientState,
        request.headers,
      );
    }

    const code = normalizeOptionalString(url.searchParams.get("code"));
    if (!code) {
      return renderOauthCallbackError(
        400,
        callbackState.returnTo,
        "SQUARE_OAUTH_CODE_MISSING",
        "Square did not provide an authorization code.",
        callbackState.clientState,
        request.headers,
      );
    }

    try {
      const result = await this.exchangeAuthorizationCode({
        businessId: callbackState.businessId,
        code,
        redirectUri: callbackState.redirectUri,
        userId: callbackState.userId,
      });

      return renderOauthCallbackSuccess(
        callbackState.returnTo,
        result,
        callbackState.clientState,
        request.headers,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "SQUARE_OAUTH_EXCHANGE_FAILED";
      return renderOauthCallbackError(
        400,
        callbackState.returnTo,
        "SQUARE_OAUTH_EXCHANGE_FAILED",
        message,
        callbackState.clientState,
        request.headers,
      );
    }
  }

  private async exchangeAuthorizationCode(input: {
    businessId: string;
    code: string;
    redirectUri: string;
    userId: string;
  }): Promise<SquareExchangeSuccess> {
    const clientId = process.env.SQUARE_APPLICATION_ID?.trim();
    const clientSecret = process.env.SQUARE_APPLICATION_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new Error("Square OAuth credentials are not configured");
    }

    const response = await fetch(`${resolveSquareOauthBaseUrl()}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": process.env.SQUARE_API_VERSION?.trim() || "2026-07-15",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: input.code,
        grant_type: "authorization_code",
        redirect_uri: input.redirectUri,
      }),
    });

    const tokenPayload = (await response.json().catch(() => ({}))) as SquareOAuthTokenResponse;
    if (!response.ok) {
      throw new Error(
        JSON.stringify({
          error: "SQUARE_OAUTH_EXCHANGE_FAILED",
          data: tokenPayload,
        }),
      );
    }

    const accessToken = tokenPayload.access_token?.trim() ?? "";
    if (!accessToken) {
      throw new Error("Missing access token in OAuth response");
    }

    const locations = await this.squareOrdersGateway.listLocations({
      accessToken,
    });

    const connection = await this.repository.save({
      accessToken,
      businessId: input.businessId,
      environment: resolveSquareConnectionEnvironment(),
      expiresAt: parseDateOrNull(tokenPayload.expires_at),
      merchantId: tokenPayload.merchant_id?.trim() || null,
      rawPayload: {
        tokenResponse: tokenPayload,
        locationsSnapshot: locations,
      },
      refreshToken: tokenPayload.refresh_token?.trim() || null,
      scope: tokenPayload.scope?.trim() || getSquareOauthScopes().join(" "),
      tokenType: tokenPayload.token_type?.trim() || null,
      userId: input.userId,
    });

    const menuSync = await this.publishSquareMenusUseCase.execute({
      accessToken,
    });

    return {
      connected: true,
      locations,
      menuSync,
      connection: {
        id: connection.id,
        businessId: connection.businessId,
        merchantId: connection.merchantId,
        environment: connection.environment,
        scope: connection.scope,
        expiresAt: connection.expiresAt?.toISOString() ?? null,
        connectedAt: connection.connectedAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
      },
    };
  }
}

async function revokeSquareConnection(
  accessToken: string,
  merchantId: string | null,
): Promise<void> {
  const clientId = process.env.SQUARE_APPLICATION_ID?.trim();
  const clientSecret = process.env.SQUARE_APPLICATION_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return;
  }

  await fetch(`${resolveSquareOauthBaseUrl()}/oauth2/revoke`, {
    method: "POST",
    headers: {
      Authorization: `Client ${clientSecret}`,
      "Content-Type": "application/json",
      "Square-Version": process.env.SQUARE_API_VERSION?.trim() || "2026-07-15",
    },
    body: JSON.stringify({
      client_id: clientId,
      ...(accessToken ? { access_token: accessToken } : {}),
      ...(!accessToken && merchantId ? { merchant_id: merchantId } : {}),
    }),
  }).catch(() => undefined);
}

function resolveSquareOauthStateSecret(): string {
  return (
    process.env.SQUARE_OAUTH_STATE_SECRET?.trim() || resolveManagerTokenSecret()
  );
}

function resolveSquareOauthStateTtlSeconds(): number {
  const configured = Number.parseInt(
    process.env.SQUARE_OAUTH_STATE_TTL_SECONDS?.trim() ?? "",
    10,
  );

  if (Number.isInteger(configured) && configured > 0) {
    return configured;
  }

  return 10 * 60;
}

function signSquareOauthState(input: {
  businessId: string;
  clientState: string | null;
  redirectUri: string;
  returnTo: string | null;
  userId: string;
}): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SignedSquareOauthStatePayload = {
    businessId: input.businessId,
    clientState: input.clientState,
    exp: issuedAt + resolveSquareOauthStateTtlSeconds(),
    iat: issuedAt,
    redirectUri: input.redirectUri,
    returnTo: input.returnTo,
    userId: input.userId,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", resolveSquareOauthStateSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifySquareOauthState(value: string): SignedSquareOauthStatePayload | null {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", resolveSquareOauthStateSecret())
    .update(encodedPayload)
    .digest("base64url");

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const businessId = normalizeOptionalString(payload.businessId);
  const redirectUri = normalizeOptionalString(payload.redirectUri);
  const userId = normalizeOptionalString(payload.userId);
  const iat = typeof payload.iat === "number" ? payload.iat : null;
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  const returnTo =
    typeof payload.returnTo === "string" ? payload.returnTo.trim() || null : null;
  const clientState =
    typeof payload.clientState === "string"
      ? payload.clientState.trim() || null
      : null;

  if (!businessId || !redirectUri || !userId || !iat || !exp) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (exp <= nowSeconds) {
    return null;
  }

  return {
    businessId,
    clientState,
    exp,
    iat,
    redirectUri,
    returnTo,
    userId,
  };
}

function resolveRequestOrigin(
  headers: HttpRequest["headers"],
): string | null {
  const configured =
    process.env.API_BASE_URL?.trim() || process.env.BACKEND_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const host =
    normalizeOptionalString(headers?.["x-forwarded-host"]) ??
    normalizeOptionalString(headers?.host);
  if (!host) {
    return null;
  }

  const protocolHeader = normalizeOptionalString(headers?.["x-forwarded-proto"]);
  const protocol = protocolHeader?.split(",")[0]?.trim() || "http";
  return `${protocol}://${host}`;
}

function resolveDefaultOauthRedirectUri(requestOrigin: string | null): string | null {
  if (!requestOrigin) {
    return null;
  }

  return new URL("/integrations/square/oauth/exchange", requestOrigin).toString();
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeRedirectTarget(
  value: string | null,
  requestOrigin: string | null,
): string | null {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("/")) {
    if (!requestOrigin) {
      return null;
    }

    return new URL(normalized, requestOrigin).toString();
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function renderOauthCallbackSuccess(
  returnTo: string | null,
  result: SquareExchangeSuccess,
  clientState: string | null,
  headers: HttpRequest["headers"],
): HttpResponse {
  const redirectResponse = buildOauthCallbackRedirect({
    clientState,
    connectionId: result.connection.id,
    menuSyncSuccess: result.menuSync.success,
    merchantId: result.connection.merchantId,
    returnTo,
    status: "success",
    headers,
  });
  if (redirectResponse) {
    return redirectResponse;
  }

  return {
    statusCode: 200,
    contentType: "text/html; charset=utf-8",
    body: buildOauthCallbackHtml({
      title: "Square connected",
      description: "The Square account was connected successfully. You can close this tab.",
    }),
  };
}

function renderOauthCallbackError(
  statusCode: number,
  returnTo: string | null,
  error: string,
  errorDescription: string,
  clientState?: string | null,
  headers?: HttpRequest["headers"],
): HttpResponse {
  const redirectResponse = buildOauthCallbackRedirect({
    clientState: clientState ?? null,
    error,
    errorDescription,
    headers,
    returnTo,
    status: "error",
  });
  if (redirectResponse) {
    return redirectResponse;
  }

  return {
    statusCode,
    contentType: "text/html; charset=utf-8",
    body: buildOauthCallbackHtml({
      title: "Square connection failed",
      description: errorDescription,
      tone: "error",
    }),
  };
}

function buildOauthCallbackRedirect(input: {
  clientState?: string | null;
  connectionId?: string | null;
  error?: string | null;
  errorDescription?: string | null;
  headers?: HttpRequest["headers"];
  menuSyncSuccess?: boolean | null;
  merchantId?: string | null;
  returnTo: string | null;
  status: "error" | "success";
}): HttpResponse | null {
  if (!input.returnTo) {
    return null;
  }

  const requestOrigin = resolveRequestOrigin(input.headers);
  const normalizedReturnTo = normalizeRedirectTarget(input.returnTo, requestOrigin);
  if (!normalizedReturnTo) {
    return null;
  }

  const redirectUrl = new URL(normalizedReturnTo);
  redirectUrl.searchParams.set("square", input.status);
  if (input.clientState) {
    redirectUrl.searchParams.set("state", input.clientState);
  }
  if (input.connectionId) {
    redirectUrl.searchParams.set("connectionId", input.connectionId);
  }
  if (typeof input.menuSyncSuccess === "boolean") {
    redirectUrl.searchParams.set(
      "menuSync",
      input.menuSyncSuccess ? "success" : "error",
    );
  }
  if (input.merchantId) {
    redirectUrl.searchParams.set("merchantId", input.merchantId);
  }
  if (input.error) {
    redirectUrl.searchParams.set("error", input.error);
  }
  if (input.errorDescription) {
    redirectUrl.searchParams.set("errorDescription", input.errorDescription);
  }

  return {
    statusCode: 302,
    headers: {
      Location: redirectUrl.toString(),
    },
    body: "",
  };
}

function buildOauthCallbackHtml(input: {
  description: string;
  title: string;
  tone?: "error" | "success";
}): string {
  const border = input.tone === "error" ? "#ef4444" : "#10b981";
  const title = escapeHtml(input.title);
  const description = escapeHtml(input.description);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;font-family:Arial,sans-serif;background:#111827;color:#f9fafb;">
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
      <section style="max-width:520px;width:100%;background:#1f2937;border:1px solid ${border};border-radius:16px;padding:24px;box-sizing:border-box;">
        <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;">${title}</h1>
        <p style="margin:0;font-size:16px;line-height:1.5;color:#d1d5db;">${description}</p>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
