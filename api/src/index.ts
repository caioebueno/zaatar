import { createServer, type IncomingMessage } from "node:http";
import { ensureEnvLoaded } from "./shared/env/loadEnv.js";
import { makeNativeCatalogController } from "./modules/catalog/main/makeNativeCatalogController.js";
import { makeLoginOwnerController } from "./modules/owner/main/makeLoginOwnerController.js";
import { makeRegisterOwnerController } from "./modules/owner/main/makeRegisterOwnerController.js";
import { makeListOwnedBusinessesController } from "./modules/owner/main/makeListOwnedBusinessesController.js";
import { makeCreateBusinessController } from "./modules/business/main/makeCreateBusinessController.js";
import { makeGetCurrentBusinessSettingsController } from "./modules/business-settings/main/makeGetCurrentBusinessSettingsController.js";
import { makeGetPublicBusinessSettingsController } from "./modules/business-settings/main/makeGetPublicBusinessSettingsController.js";
import { makeUpdateCurrentBusinessSettingsController } from "./modules/business-settings/main/makeUpdateCurrentBusinessSettingsController.js";
import { makeUberEatsOAuthController } from "./modules/integrations/main/makeUberEatsOAuthController.js";
import { makeGetOrderSalesAnalyticsController } from "./modules/analytics/main/makeGetOrderSalesAnalyticsController.js";
import { makeListOrdersController } from "./modules/orders/main/makeListOrdersController.js";
import { makeGetOrderByIdController } from "./modules/orders/main/makeGetOrderByIdController.js";
import { makeListFeedbackController } from "./modules/feedback/main/makeListFeedbackController.js";
import { makeOnboardingController } from "./modules/onboarding/main/makeOnboardingController.js";
import { makeBranchesController } from "./modules/branches/main/makeBranchesController.js";
import { makeDriverAuthController } from "./modules/driver/main/makeDriverAuthController.js";
import { makeDriverController } from "./modules/driver/main/makeDriverController.js";
import { makeGetNextDispatchForDriverController } from "./modules/dispatch/main/makeGetNextDispatchForDriverController.js";
import { HmacDriverAccessTokenVerifier } from "./modules/driver/infrastructure/security/HmacDriverAccessTokenVerifier.js";
import { HmacAccessTokenVerifier } from "./modules/owner/infrastructure/security/HmacAccessTokenVerifier.js";
import prisma from "./prisma.js";
import { setCorsHeaders } from "./shared/http/cors.js";
import {
  readFormDataBody,
  readJsonBody,
  readRawBody,
  sendJson,
} from "./shared/http/json.js";
import type { HttpController } from "./shared/http/types.js";

ensureEnvLoaded();

const MANAGER_ACCESS_TOKEN_COOKIE_NAME = "manager_access_token";
const MANAGER_BUSINESS_ID_COOKIE_NAME = "manager_business_id";
const BUSINESS_ID_HEADER_NAME = "x-business-id";
const port = Number(process.env.PORT ?? 4000);

const registerOwnerController = makeRegisterOwnerController();
const loginOwnerController = makeLoginOwnerController();
const listOwnedBusinessesController = makeListOwnedBusinessesController();
const createBusinessController = makeCreateBusinessController();
const getCurrentBusinessSettingsController = makeGetCurrentBusinessSettingsController();
const getPublicBusinessSettingsController = makeGetPublicBusinessSettingsController();
const updateCurrentBusinessSettingsController =
  makeUpdateCurrentBusinessSettingsController();
const nativeCatalogController = makeNativeCatalogController();
const uberEatsOAuthController = makeUberEatsOAuthController();
const getOrderSalesAnalyticsController = makeGetOrderSalesAnalyticsController();
const listOrdersController = makeListOrdersController();
const getOrderByIdController = makeGetOrderByIdController();
const listFeedbackController = makeListFeedbackController();
const onboardingController = makeOnboardingController();
const branchesController = makeBranchesController();
const driverAuthController = makeDriverAuthController();
const driverController = makeDriverController();
const getNextDispatchForDriverController = makeGetNextDispatchForDriverController();
const accessTokenVerifier = new HmacAccessTokenVerifier();
const driverAccessTokenVerifier = new HmacDriverAccessTokenVerifier();

type Route = {
  bodyMode?: "form-data" | "json" | "raw";
  controller: HttpController;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  matcher: RegExp;
  requiresAuth: boolean;
  requiresDriverAuth?: boolean;
};

const routes: Route[] = [
  {
    method: "POST",
    matcher: /^\/owners$/,
    controller: registerOwnerController,
    requiresAuth: false,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/owners\/register$/,
    controller: registerOwnerController,
    requiresAuth: false,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/owners\/login$/,
    controller: loginOwnerController,
    requiresAuth: false,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/drivers\/auth\/otp\/send$/,
    controller: driverAuthController,
    requiresAuth: false,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/drivers\/auth\/otp\/verify$/,
    controller: driverAuthController,
    requiresAuth: false,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/public\/order-link\/settings$/,
    controller: getPublicBusinessSettingsController,
    requiresAuth: false,
  },
  {
    method: "GET",
    matcher: /^\/dispatches\/next$/,
    controller: getNextDispatchForDriverController,
    requiresAuth: false,
    requiresDriverAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/drivers$/,
    controller: driverController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/drivers$/,
    controller: driverController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/drivers\/[^/]+$/,
    controller: driverController,
    requiresAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/drivers\/[^/]+$/,
    controller: driverController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/drivers\/[^/]+$/,
    controller: driverController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/businesses$/,
    controller: createBusinessController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/businesses$/,
    controller: listOwnedBusinessesController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/businesses\/current\/settings$/,
    controller: getCurrentBusinessSettingsController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/businesses\/current\/onboarding$/,
    controller: onboardingController,
    requiresAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/businesses\/current\/onboarding$/,
    controller: onboardingController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/businesses\/current\/branches$/,
    controller: branchesController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/businesses\/current\/onboarding\/branches$/,
    controller: onboardingController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/businesses\/current\/onboarding\/branches\/[^/]+$/,
    controller: onboardingController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/businesses\/current\/onboarding\/branches\/[^/]+$/,
    controller: onboardingController,
    requiresAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/businesses\/current\/settings$/,
    controller: updateCurrentBusinessSettingsController,
    requiresAuth: true,
    bodyMode: "json",
  },

  {
    method: "GET",
    matcher: /^\/products$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/orders$/,
    controller: listOrdersController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/orders\/[^/]+$/,
    controller: getOrderByIdController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/feedbacks$/,
    controller: listFeedbackController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/feedback$/,
    controller: listFeedbackController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/products$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/products\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },

  {
    method: "GET",
    matcher: /^\/menus$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/analytics\/sales$/,
    controller: getOrderSalesAnalyticsController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/analytics\/orders\/sales$/,
    controller: getOrderSalesAnalyticsController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/menus$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/menus\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },

  {
    method: "GET",
    matcher: /^\/categories$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/categories$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/categories\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/categories\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },

  {
    method: "POST",
    matcher: /^\/modifier-groups$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/modifier-groups\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/modifier-groups\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },

  {
    method: "POST",
    matcher: /^\/modifier-group-items$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/modifier-group-items\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/modifier-group-items\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },

  {
    method: "POST",
    matcher: /^\/bucket\/upload$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "form-data",
  },
  {
    method: "POST",
    matcher: /^\/integrations\/stripe\/connect\/onboarding-link$/,
    controller: onboardingController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/integrations\/stripe\/connect\/status$/,
    controller: onboardingController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/integrations\/stripe\/connect\/banking-profile$/,
    controller: onboardingController,
    requiresAuth: true,
    bodyMode: "json",
  },

  {
    method: "GET",
    matcher: /^\/integrations\/uber-eats\/connection$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/uber-eats\/stores$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/uber-eats\/menu-sync\/status$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/uber-eats\/menu-sync\/history$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/uber-eats\/menu-sync\/preview$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/uber-eats\/oauth\/url$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/integrations\/uber-eats\/oauth\/exchange$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/integrations\/uber-eats\/menu-sync\/publish$/,
    controller: uberEatsOAuthController,
    requiresAuth: true,
    bodyMode: "json",
  },
];

const server = createServer(async (request, response) => {
  const method = request.method;
  const url = request.url;

  if (!method || !url) {
    sendJson(response, 400, { error: "Invalid request" });
    return;
  }

  if (method === "OPTIONS") {
    setCorsHeaders(response);
    response.writeHead(204);
    response.end();
    return;
  }

  const parsedUrl = new URL(url, "http://localhost");
  const path = parsedUrl.pathname;

  if (method === "GET" && path === "/health") {
    sendJson(response, 200, {
      service: "foody-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const route = routes.find(
    (item) => item.method === method && item.matcher.test(path),
  );

  if (!route) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  let auth:
    | {
        businessId?: string | null;
        email: string;
        name: string;
        userId: string;
      }
    | undefined;
  let driverAuth:
    | {
        driverId: string;
        name: string;
        phone: string;
      }
    | undefined;

  if (route.requiresDriverAuth) {
    const accessToken = extractAccessToken(request);
    const tokenPayload = accessToken
      ? driverAccessTokenVerifier.verify(accessToken)
      : null;
    if (!tokenPayload) {
      sendJson(response, 401, { error: "Unauthorized" });
      return;
    }

    driverAuth = tokenPayload;
  } else if (route.requiresAuth) {
    const accessToken = extractAccessToken(request);
    const tokenPayload = accessToken ? accessTokenVerifier.verify(accessToken) : null;
    if (!tokenPayload) {
      sendJson(response, 401, { error: "Unauthorized" });
      return;
    }

    const requestedBusinessId = extractBusinessId(request, parsedUrl);
    const businessContext = await resolveBusinessIdForUser(
      tokenPayload.userId,
      requestedBusinessId,
    );

    if (businessContext === "__forbidden__") {
      sendJson(response, 403, { error: "Forbidden", reason: "BUSINESS_ACCESS_DENIED" });
      return;
    }

    auth = {
      ...tokenPayload,
      businessId: businessContext,
    };
  }

  try {
    const requestPathWithSearch = `${path}${parsedUrl.search}`;
    const bodyMode = route.bodyMode ?? "json";
    let body: unknown = undefined;
    let formData: FormData | undefined = undefined;
    let rawBody: Buffer | undefined = undefined;

    if (method !== "GET" && method !== "DELETE") {
      if (bodyMode === "form-data") {
        formData = await readFormDataBody(
          request,
          readHeaderValue(request.headers["content-type"]) ?? undefined,
        );
      } else if (bodyMode === "raw") {
        rawBody = await readRawBody(request);
      } else {
        body = await readJsonBody(request);
      }
    }

    const incomingBusinessIdHeader = readHeaderValue(
      request.headers[BUSINESS_ID_HEADER_NAME],
    );
    const result = await route.controller.handle({
      method,
      path: requestPathWithSearch,
      auth,
      driverAuth,
      body,
      formData,
      rawBody,
      headers: {
        "content-type": request.headers["content-type"],
        [BUSINESS_ID_HEADER_NAME]:
          auth?.businessId ?? incomingBusinessIdHeader ?? undefined,
      },
    });

    sendJson(response, result.statusCode, result.body);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      sendJson(response, 413, { error: "Payload too large" });
      return;
    }

    if (error instanceof Error && error.message === "INVALID_JSON") {
      sendJson(response, 400, { error: "Invalid JSON payload" });
      return;
    }

    if (error instanceof Error && error.message === "INVALID_FORM_DATA") {
      sendJson(response, 400, { error: "Invalid multipart form-data payload" });
      return;
    }

    console.error("[api] request failed:", error);
    sendJson(response, 500, { error: "Internal Server Error" });
  }
});

server.listen(port, () => {
  console.log(`[api] listening on port ${port}`);
});

function extractAccessToken(request: IncomingMessage): string | null {
  const authorization = request.headers.authorization;

  if (authorization && authorization.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token) return token;
  }

  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    if (!rawName || rawValueParts.length === 0) continue;
    if (rawName !== MANAGER_ACCESS_TOKEN_COOKIE_NAME) continue;

    const rawValue = rawValueParts.join("=").trim();
    if (!rawValue) return null;

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

function readHeaderValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = item.trim();
      if (normalized) return normalized;
    }
  }

  return null;
}

function extractBusinessId(request: IncomingMessage, parsedUrl: URL): string | null {
  const fromHeader = request.headers[BUSINESS_ID_HEADER_NAME];
  if (typeof fromHeader === "string" && fromHeader.trim()) {
    return fromHeader.trim();
  }

  const fromQuery = parsedUrl.searchParams.get("businessId")?.trim();
  if (fromQuery) return fromQuery;

  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    if (!rawName || rawValueParts.length === 0) continue;
    if (rawName !== MANAGER_BUSINESS_ID_COOKIE_NAME) continue;

    const rawValue = rawValueParts.join("=").trim();
    if (!rawValue) return null;

    try {
      const decoded = decodeURIComponent(rawValue).trim();
      return decoded || null;
    } catch {
      return rawValue || null;
    }
  }

  return null;
}

async function resolveBusinessIdForUser(
  userId: string,
  requestedBusinessId: string | null,
): Promise<string | null | "__forbidden__"> {
  const owned = await prisma.businessOwner.findMany({
    where: { userId },
    select: {
      businessId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (owned.length === 0) {
    return null;
  }

  if (requestedBusinessId) {
    const allowed = owned.some(
      (item) => item.businessId.trim() === requestedBusinessId.trim(),
    );
    return allowed ? requestedBusinessId : "__forbidden__";
  }

  return owned[0]?.businessId ?? null;
}
