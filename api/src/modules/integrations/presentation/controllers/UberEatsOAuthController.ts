import type { HttpController, HttpRequest, HttpResponse } from "../../../../shared/http/types.js";
import type { ExternalIntegrationEnvironment } from "../../application/ports/UberEatsConnectionRepository.js";
import type { UberEatsMenuSyncRepository } from "../../application/ports/UberEatsMenuSyncRepository.js";
import type { GetUberEatsConnectionUseCase } from "../../application/use-cases/GetUberEatsConnectionUseCase.js";
import type { PublishUberEatsMenuUseCase } from "../../application/use-cases/PublishUberEatsMenuUseCase.js";
import type { SaveUberEatsConnectionUseCase } from "../../application/use-cases/SaveUberEatsConnectionUseCase.js";
import { buildUberMenuPayload } from "../../application/services/uberEatsMenuPayload.js";
import { resolveIntegrationEnvironment } from "../../infrastructure/prisma/PrismaUberEatsConnectionRepository.js";

type UberOAuthTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  [key: string]: unknown;
};

type UberStoreSummary = {
  id: string;
  name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getConfiguredScopes(): string {
  const configured = process.env.UBER_EATS_OAUTH_SCOPES?.trim();
  return configured || "eats.pos_provisioning";
}

function getUberAuthBaseUrl(): string {
  const configured = process.env.UBER_EATS_OAUTH_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return "https://sandbox-login.uber.com";
}

function getConfiguredPrompt(): string | null {
  const configured = process.env.UBER_EATS_OAUTH_PROMPT?.trim();
  if (!configured) return "login";
  if (configured === "login" || configured === "consent") return configured;
  return "login";
}

function getDefaultRedirectUri(): string | null {
  const value = process.env.UBER_EATS_REDIRECT_URI?.trim();
  if (!value) return null;
  return value;
}

function resolveUberApiBaseUrl(): string {
  const raw = process.env.UBER_EATS_API_BASE_URL?.trim();
  if (!raw) return "https://api.uber.com";
  return raw.replace(/\/+$/, "");
}

function normalizeUberStores(value: unknown): UberStoreSummary[] {
  const source = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.stores)
      ? value.stores
      : isRecord(value) && Array.isArray(value.data)
        ? value.data
        : [];

  const mapped = source
    .map((item): UberStoreSummary | null => {
      if (!isRecord(item)) return null;
      const idCandidates = [item.store_id, item.storeId, item.id, item.uuid];
      const nameCandidates = [item.name, item.title, item.display_name, item.displayName];
      const id = idCandidates.find(
        (candidate): candidate is string =>
          typeof candidate === "string" && candidate.trim().length > 0,
      );
      if (!id) return null;
      const name = nameCandidates.find(
        (candidate): candidate is string =>
          typeof candidate === "string" && candidate.trim().length > 0,
      );
      return {
        id: id.trim(),
        name: (name ?? "Unnamed store").trim(),
      };
    })
    .filter((store): store is UberStoreSummary => store !== null);

  const seen = new Set<string>();
  return mapped.filter((store) => {
    if (seen.has(store.id)) return false;
    seen.add(store.id);
    return true;
  });
}

function extractPersistedUberStores(rawPayload: unknown): UberStoreSummary[] {
  if (!isRecord(rawPayload)) return [];
  if (isRecord(rawPayload.storesSnapshot)) {
    return normalizeUberStores(rawPayload.storesSnapshot.stores);
  }
  return normalizeUberStores(rawPayload.stores);
}

async function fetchUberStoresFromApi(accessToken: string): Promise<{
  rawPayload: unknown;
  stores: UberStoreSummary[];
}> {
  const response = await fetch(`${resolveUberApiBaseUrl()}/v1/eats/stores`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
  });

  const rawPayload = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    throw new Error(`UBER_EATS_STORES_FETCH_FAILED_${response.status}`);
  }

  return {
    rawPayload,
    stores: normalizeUberStores(rawPayload),
  };
}

export class UberEatsOAuthController implements HttpController {
  constructor(
    private readonly getConnectionUseCase: GetUberEatsConnectionUseCase,
    private readonly saveConnectionUseCase: SaveUberEatsConnectionUseCase,
    private readonly publishMenuUseCase: PublishUberEatsMenuUseCase,
    private readonly syncRepository: UberEatsMenuSyncRepository,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;
    const userId = request.auth?.userId;

    if (!userId) {
      return {
        statusCode: 401,
        body: { error: "Unauthorized" },
      };
    }

    if (request.method === "GET" && pathname === "/integrations/uber-eats/connection") {
      try {
        const connection = await this.getConnectionUseCase.execute(userId);
        const stores = connection ? extractPersistedUberStores(connection.rawPayload) : [];

        return {
          statusCode: 200,
          body: {
            connected: Boolean(connection),
            stores,
            connection: connection
              ? {
                  id: connection.id,
                  environment: connection.environment,
                  scope: connection.scope,
                  expiresAt: connection.expiresAt?.toISOString() ?? null,
                  connectedAt: connection.connectedAt.toISOString(),
                  updatedAt: connection.updatedAt.toISOString(),
                }
              : null,
          },
        };
      } catch (error) {
        if (isMissingIntegrationTable(error)) {
          return {
            statusCode: 503,
            body: {
              error: "INTEGRATION_STORAGE_NOT_READY",
              message: "Run Prisma migrations to enable Uber Eats persistence.",
            },
          };
        }

        throw error;
      }
    }

    if (request.method === "GET" && pathname === "/integrations/uber-eats/stores") {
      try {
        const connection = await this.getConnectionUseCase.execute(userId);
        const stores = connection ? extractPersistedUberStores(connection.rawPayload) : [];

        return {
          statusCode: 200,
          body: {
            connected: Boolean(connection),
            stores,
          },
        };
      } catch (error) {
        if (isMissingIntegrationTable(error)) {
          return {
            statusCode: 503,
            body: {
              error: "INTEGRATION_STORAGE_NOT_READY",
              message: "Run Prisma migrations to enable Uber Eats persistence.",
            },
          };
        }

        throw error;
      }
    }

    if (request.method === "GET" && pathname === "/integrations/uber-eats/menu-sync/status") {
      const menuId = url.searchParams.get("menuId")?.trim() ?? "";
      if (!menuId) {
        return {
          statusCode: 400,
          body: { error: "menuId is required" },
        };
      }

      const [connection, latestRun] = await Promise.all([
        this.getConnectionUseCase.execute(userId),
        this.syncRepository.findLatestForMenu(userId, menuId),
      ]);

      return {
        statusCode: 200,
        body: {
          connected: Boolean(connection),
          latestRun: latestRun
            ? {
                ...latestRun,
                createdAt: latestRun.createdAt.toISOString(),
                updatedAt: latestRun.updatedAt.toISOString(),
                startedAt: latestRun.startedAt?.toISOString() ?? null,
                finishedAt: latestRun.finishedAt?.toISOString() ?? null,
              }
            : null,
        },
      };
    }

    if (request.method === "GET" && pathname === "/integrations/uber-eats/menu-sync/history") {
      const menuId = url.searchParams.get("menuId")?.trim() || undefined;
      const limitRaw = url.searchParams.get("limit")?.trim();
      const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 20;

      const runs = await this.syncRepository.listRuns({
        userId,
        menuId,
        limit: Number.isFinite(limit) ? limit : 20,
      });

      return {
        statusCode: 200,
        body: {
          runs: runs.map((run) => ({
            ...run,
            createdAt: run.createdAt.toISOString(),
            updatedAt: run.updatedAt.toISOString(),
            startedAt: run.startedAt?.toISOString() ?? null,
            finishedAt: run.finishedAt?.toISOString() ?? null,
          })),
        },
      };
    }

    if (request.method === "GET" && pathname === "/integrations/uber-eats/menu-sync/preview") {
      const menuId = url.searchParams.get("menuId")?.trim() ?? "";
      if (!menuId) {
        return {
          statusCode: 400,
          body: { error: "menuId is required" },
        };
      }

      const [built, itemMaps, latestRun] = await Promise.all([
        buildUberMenuPayload(menuId),
        this.syncRepository.listEntityMaps({
          userId,
          menuId,
          entityType: "ITEM",
        }),
        this.syncRepository.findLatestForMenu(userId, menuId),
      ]);

      const mapByProductId = new Map(
        itemMaps.map((row) => {
          const hash =
            isRecord(row.rawPayload) && typeof row.rawPayload.hash === "string"
              ? row.rawPayload.hash
              : null;
          return [row.internalEntityId, { hash }];
        }),
      );

      const statuses = built.itemSnapshots.map((item) => {
        const mapEntry = mapByProductId.get(item.id);
        if (!item.visible) {
          return {
            productId: item.id,
            productName: item.name,
            categoryId: item.categoryId,
            status: mapEntry ? "EXCLUDED" : "NOT_SYNCED",
            reason: mapEntry
              ? "Hidden item will be disabled on channel"
              : "Hidden item is excluded from publish",
          };
        }

        if (!mapEntry) {
          return {
            productId: item.id,
            productName: item.name,
            categoryId: item.categoryId,
            status: "NOT_SYNCED",
            reason: "Not mapped to Uber Eats yet",
          };
        }

        if (!mapEntry.hash || mapEntry.hash !== item.hash) {
          return {
            productId: item.id,
            productName: item.name,
            categoryId: item.categoryId,
            status: "NEEDS_SYNC",
            reason: "Product changed since last publish",
          };
        }

        return {
          productId: item.id,
          productName: item.name,
          categoryId: item.categoryId,
          status: "SYNCED",
          reason: "Already synced",
        };
      });

      const grouped = {
        toCreate: statuses.filter((item) => item.status === "NOT_SYNCED" && item.reason.includes("Not mapped")),
        toUpdate: statuses.filter((item) => item.status === "NEEDS_SYNC"),
        toDisable: statuses.filter((item) => item.status === "EXCLUDED"),
        noChange: statuses.filter((item) => item.status === "SYNCED"),
      };

      return {
        statusCode: 200,
        body: {
          hash: built.hash,
          counts: built.counts,
          latestRun: latestRun
            ? {
                ...latestRun,
                createdAt: latestRun.createdAt.toISOString(),
                updatedAt: latestRun.updatedAt.toISOString(),
                startedAt: latestRun.startedAt?.toISOString() ?? null,
                finishedAt: latestRun.finishedAt?.toISOString() ?? null,
              }
            : null,
          summary: {
            totalItems: statuses.length,
            synced: statuses.filter((item) => item.status === "SYNCED").length,
            needsSync: statuses.filter((item) => item.status === "NEEDS_SYNC").length,
            notSynced: statuses.filter((item) => item.status === "NOT_SYNCED").length,
            excluded: statuses.filter((item) => item.status === "EXCLUDED").length,
          },
          groups: grouped,
          items: statuses,
        },
      };
    }

    if (request.method === "GET" && pathname === "/integrations/uber-eats/oauth/url") {
      const clientId = process.env.UBER_EATS_CLIENT_ID?.trim();
      if (!clientId) {
        return {
          statusCode: 500,
          body: { error: "UBER_EATS_CLIENT_ID is not configured" },
        };
      }

      const redirectUri =
        url.searchParams.get("redirectUri")?.trim() ||
        getDefaultRedirectUri();

      if (!redirectUri) {
        return {
          statusCode: 400,
          body: { error: "redirectUri is required" },
        };
      }

      const state = url.searchParams.get("state")?.trim();

      const oauthUrl = new URL("/oauth/v2/authorize", getUberAuthBaseUrl());
      oauthUrl.searchParams.set("client_id", clientId);
      oauthUrl.searchParams.set("response_type", "code");
      oauthUrl.searchParams.set("redirect_uri", redirectUri);
      oauthUrl.searchParams.set("scope", getConfiguredScopes());
      const prompt = getConfiguredPrompt();
      if (prompt) oauthUrl.searchParams.set("prompt", prompt);
      if (state) oauthUrl.searchParams.set("state", state);

      console.log("[api] Uber Eats OAuth authorize URL:", oauthUrl.toString());

      return {
        statusCode: 200,
        body: {
          authorizationUrl: oauthUrl.toString(),
          redirectUri,
          scope: getConfiguredScopes(),
        },
      };
    }

    if (request.method === "POST" && pathname === "/integrations/uber-eats/oauth/exchange") {
      if (!isRecord(request.body)) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload" },
        };
      }

      const code = typeof request.body.code === "string" ? request.body.code.trim() : "";
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

      const clientId = process.env.UBER_EATS_CLIENT_ID?.trim();
      const clientSecret = process.env.UBER_EATS_CLIENT_SECRET?.trim();

      if (!clientId || !clientSecret) {
        return {
          statusCode: 500,
          body: { error: "Uber Eats OAuth credentials are not configured" },
        };
      }

      const payload = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      });

      const tokenUrl = new URL("/oauth/v2/token", getUberAuthBaseUrl()).toString();
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      const tokenPayload = (await response.json().catch(() => ({}))) as UberOAuthTokenResponse;

      if (!response.ok) {
        return {
          statusCode: 400,
          body: {
            error: "UBER_EATS_OAUTH_EXCHANGE_FAILED",
            data: tokenPayload,
          },
        };
      }

      const expiresInSeconds = toNullableNumber(tokenPayload.expires_in);
      const expiresAt =
        typeof expiresInSeconds === "number" && expiresInSeconds > 0
          ? new Date(Date.now() + expiresInSeconds * 1000)
          : null;
      const environment = resolveIntegrationEnvironment();
      const accessToken =
        typeof tokenPayload.access_token === "string"
          ? tokenPayload.access_token.trim()
          : "";

      if (!accessToken) {
        return {
          statusCode: 400,
          body: {
            error: "UBER_EATS_OAUTH_EXCHANGE_FAILED",
            data: { reason: "Missing access token in OAuth response" },
          },
        };
      }

      let connection;
      let stores: UberStoreSummary[] = [];
      let storesFetchError: string | null = null;
      let storesRawPayload: unknown = null;

      try {
        const fetchedStores = await fetchUberStoresFromApi(accessToken);
        stores = fetchedStores.stores;
        storesRawPayload = fetchedStores.rawPayload;
      } catch (error) {
        storesFetchError =
          error instanceof Error ? error.message : "UBER_EATS_STORES_FETCH_FAILED";
      }

      try {
        connection = await this.saveConnectionUseCase.execute({
          userId,
          environment,
          accessToken,
          refreshToken:
            typeof tokenPayload.refresh_token === "string"
              ? tokenPayload.refresh_token
              : null,
          scope:
            typeof tokenPayload.scope === "string" ? tokenPayload.scope : null,
          tokenType:
            typeof tokenPayload.token_type === "string"
              ? tokenPayload.token_type
              : null,
          expiresAt,
          rawPayload: {
            oauthTokenPayload: tokenPayload,
            storesSnapshot: {
              fetchedAt: new Date().toISOString(),
              stores,
              rawPayload: storesRawPayload,
              error: storesFetchError,
            },
          },
        });
      } catch (error) {
        if (isMissingIntegrationTable(error)) {
          return {
            statusCode: 503,
            body: {
              error: "INTEGRATION_STORAGE_NOT_READY",
              message: "Run Prisma migrations to enable Uber Eats persistence.",
            },
          };
        }

        throw error;
      }

      return {
        statusCode: 200,
        body: {
          connected: true,
          scope: connection.scope,
          expiresIn: expiresInSeconds,
          expiresAt: connection.expiresAt?.toISOString() ?? null,
          tokenType:
            typeof tokenPayload.token_type === "string" ? tokenPayload.token_type : null,
          environment: toEnvironmentLabel(environment),
          stores,
          storesFetchError,
          hasRefreshToken: Boolean(
            typeof tokenPayload.refresh_token === "string" &&
              tokenPayload.refresh_token.trim().length > 0,
          ),
        },
      };
    }

    if (request.method === "POST" && pathname === "/integrations/uber-eats/menu-sync/publish") {
      if (!isRecord(request.body)) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload" },
        };
      }

      const menuId =
        typeof request.body.menuId === "string" ? request.body.menuId.trim() : "";
      const storeId =
        typeof request.body.storeId === "string"
          ? request.body.storeId.trim()
          : (process.env.UBER_EATS_STORE_ID?.trim() ?? "");
      const dryRun = request.body.dryRun === true;
      const force = request.body.force === true;

      if (!menuId || !storeId) {
        return {
          statusCode: 400,
          body: {
            error: "menuId and storeId are required",
          },
        };
      }

      try {
        const result = await this.publishMenuUseCase.execute({
          userId,
          menuId,
          storeId,
          dryRun,
          force,
        });

        return {
          statusCode: 200,
          body: {
            success: true,
            skipped: result.skipped,
            hash: result.hash,
            run: {
              ...result.run,
              createdAt: result.run.createdAt.toISOString(),
              updatedAt: result.run.updatedAt.toISOString(),
              startedAt: result.run.startedAt?.toISOString() ?? null,
              finishedAt: result.run.finishedAt?.toISOString() ?? null,
            },
          },
        };
      } catch (error) {
        if (error instanceof Error && error.message === "UBER_EATS_NOT_CONNECTED") {
          return {
            statusCode: 400,
            body: { error: "UBER_EATS_NOT_CONNECTED" },
          };
        }
        if (error instanceof Error && error.message === "MENU_NOT_FOUND") {
          return {
            statusCode: 404,
            body: { error: "MENU_NOT_FOUND" },
          };
        }
        if (error instanceof Error && error.message.startsWith("UBER_SYNC_FAILED_")) {
          return {
            statusCode: 502,
            body: { error: error.message },
          };
        }

        throw error;
      }
    }

    return {
      statusCode: 404,
      body: { error: "Not found" },
    };
  }
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toEnvironmentLabel(value: ExternalIntegrationEnvironment): "SANDBOX" | "PRODUCTION" {
  return value === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}

function isMissingIntegrationTable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes(`relation "ExternalIntegrationConnection" does not exist`);
}
