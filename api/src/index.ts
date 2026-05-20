import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import { ensureEnvLoaded } from "./shared/env/loadEnv.js";
import { makeNativeCatalogController } from "./modules/catalog/main/makeNativeCatalogController.js";
import { makeLoginOwnerController } from "./modules/owner/main/makeLoginOwnerController.js";
import { makeOwnerAuthController } from "./modules/owner/main/makeOwnerAuthController.js";
import { makeRegisterOwnerController } from "./modules/owner/main/makeRegisterOwnerController.js";
import { makeCreateBusinessController } from "./modules/business/main/makeCreateBusinessController.js";
import { makeGetCurrentBusinessController } from "./modules/business/main/makeGetCurrentBusinessController.js";
import { makeListOwnedBusinessesController } from "./modules/business/main/makeListOwnedBusinessesController.js";
import { makeGetCurrentBusinessSettingsController } from "./modules/business-settings/main/makeGetCurrentBusinessSettingsController.js";
import { makeGetPublicBusinessSettingsController } from "./modules/business-settings/main/makeGetPublicBusinessSettingsController.js";
import { makeUpdateCurrentBusinessSettingsController } from "./modules/business-settings/main/makeUpdateCurrentBusinessSettingsController.js";
import { makeUberEatsOAuthController } from "./modules/integrations/main/makeUberEatsOAuthController.js";
import { makeGetOrderSalesAnalyticsController } from "./modules/analytics/main/makeGetOrderSalesAnalyticsController.js";
import { makeListOrdersController } from "./modules/orders/main/makeListOrdersController.js";
import { makeGetOrderByIdController } from "./modules/orders/main/makeGetOrderByIdController.js";
import { makeGetOrdersByStationController } from "./modules/orders/main/makeGetOrdersByStationController.js";
import { makeUpdateOrderController } from "./modules/orders/main/makeUpdateOrderController.js";
import { makeManageOrdersController } from "./modules/orders/main/makeManageOrdersController.js";
import { makeListFeedbackController } from "./modules/feedback/main/makeListFeedbackController.js";
import { makeOnboardingController } from "./modules/onboarding/main/makeOnboardingController.js";
import { makeBranchesController } from "./modules/branches/main/makeBranchesController.js";
import { makeDriverAuthController } from "./modules/driver/main/makeDriverAuthController.js";
import { makeDriverController } from "./modules/driver/main/makeDriverController.js";
import { makeDriverSelfController } from "./modules/driver/main/makeDriverSelfController.js";
import { makeGetNextDispatchForDriverController } from "./modules/dispatch/main/makeGetNextDispatchForDriverController.js";
import { makeSetDispatchStartedDeliveryAtController } from "./modules/dispatch/main/makeSetDispatchStartedDeliveryAtController.js";
import { makeListDispatchesController } from "./modules/dispatch/main/makeListDispatchesController.js";
import { makeUpdateDispatchController } from "./modules/dispatch/main/makeUpdateDispatchController.js";
import { makeMoveDispatchOrderController } from "./modules/dispatch/main/makeMoveDispatchOrderController.js";
import { makeListDriverDispatchesByDateRangeController } from "./modules/dispatch/main/makeListDriverDispatchesByDateRangeController.js";
import { makeDispatchRouteController } from "./modules/dispatch-route/main/makeDispatchRouteController.js";
import { makeStationController } from "./modules/station/main/makeStationController.js";
import { makePreparationTaskController } from "./modules/preparation-task/main/makePreparationTaskController.js";
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

ensureEnvLoaded()

const MANAGER_ACCESS_TOKEN_COOKIE_NAME = "manager_access_token";
const MANAGER_BUSINESS_ID_COOKIE_NAME = "manager_business_id";
const BUSINESS_ID_HEADER_NAME = "x-business-id";
const port = Number(process.env.PORT ?? 4000);
const isDevLoggingEnabled = process.env.DEV === "1";

const registerOwnerController = makeRegisterOwnerController();
const loginOwnerController = makeLoginOwnerController();
const ownerAuthController = makeOwnerAuthController();
const listOwnedBusinessesController = makeListOwnedBusinessesController();
const createBusinessController = makeCreateBusinessController();
const getCurrentBusinessController = makeGetCurrentBusinessController();
const getCurrentBusinessSettingsController = makeGetCurrentBusinessSettingsController();
const getPublicBusinessSettingsController = makeGetPublicBusinessSettingsController();
const updateCurrentBusinessSettingsController =
  makeUpdateCurrentBusinessSettingsController();
const nativeCatalogController = makeNativeCatalogController();
const uberEatsOAuthController = makeUberEatsOAuthController();
const getOrderSalesAnalyticsController = makeGetOrderSalesAnalyticsController();
const listOrdersController = makeListOrdersController();
const getOrderByIdController = makeGetOrderByIdController();
const getOrdersByStationController = makeGetOrdersByStationController();
const updateOrderController = makeUpdateOrderController();
const manageOrdersController = makeManageOrdersController();
const listFeedbackController = makeListFeedbackController();
const onboardingController = makeOnboardingController();
const branchesController = makeBranchesController();
const stationController = makeStationController();
const preparationTaskController = makePreparationTaskController();
const driverAuthController = makeDriverAuthController();
const driverController = makeDriverController();
const driverSelfController = makeDriverSelfController();
const listDispatchesController = makeListDispatchesController();
const updateDispatchController = makeUpdateDispatchController();
const moveDispatchOrderController = makeMoveDispatchOrderController();
const getNextDispatchForDriverController = makeGetNextDispatchForDriverController();
const listDriverDispatchesByDateRangeController =
  makeListDriverDispatchesByDateRangeController();
const setDispatchStartedDeliveryAtController =
  makeSetDispatchStartedDeliveryAtController();
const dispatchRouteController = makeDispatchRouteController();
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
    matcher: /^\/owners\/auth\/otp\/send$/,
    controller: ownerAuthController,
    requiresAuth: false,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/owners\/auth\/otp\/verify$/,
    controller: ownerAuthController,
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
    matcher: /^\/dispatches$/,
    controller: listDispatchesController,
    requiresAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/dispatches\/[^/]+$/,
    controller: updateDispatchController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/dispatches\/orders\/[^/]+$/,
    controller: moveDispatchOrderController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/dispatches\/next$/,
    controller: getNextDispatchForDriverController,
    requiresAuth: false,
    requiresDriverAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/drivers\/dispatches$/,
    controller: listDriverDispatchesByDateRangeController,
    requiresAuth: false,
    requiresDriverAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/drivers\/dispatches\/[^/]+\/started-delivery$/,
    controller: setDispatchStartedDeliveryAtController,
    requiresAuth: false,
    requiresDriverAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/drivers\/location$/,
    controller: dispatchRouteController,
    requiresAuth: false,
    requiresDriverAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/drivers\/dispatches\/[^/]+\/route\/start$/,
    controller: dispatchRouteController,
    requiresAuth: false,
    requiresDriverAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/drivers\/dispatches\/[^/]+\/route\/points\/batch$/,
    controller: dispatchRouteController,
    requiresAuth: false,
    requiresDriverAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/drivers\/dispatches\/[^/]+\/route\/stop$/,
    controller: dispatchRouteController,
    requiresAuth: false,
    requiresDriverAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/drivers\/me\/activate$/,
    controller: driverSelfController,
    requiresAuth: false,
    requiresDriverAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/drivers\/me\/deactivate$/,
    controller: driverSelfController,
    requiresAuth: false,
    requiresDriverAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/dispatches\/[^/]+\/route$/,
    controller: dispatchRouteController,
    requiresAuth: true,
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
    matcher: /^\/stations$/,
    controller: stationController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/stations$/,
    controller: stationController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/stations\/[^/]+$/,
    controller: stationController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/stations\/[^/]+$/,
    controller: stationController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/stations\/[^/]+\/steps$/,
    controller: stationController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/stations\/[^/]+\/steps\/[^/]+$/,
    controller: stationController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/stations\/[^/]+\/steps\/[^/]+$/,
    controller: stationController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/stations\/[^/]+\/orders\/[^/]+\/complete$/,
    controller: stationController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/preparation-task-(stations|categories)$/,
    controller: preparationTaskController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/preparation-task-(stations|categories)$/,
    controller: preparationTaskController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/preparation-task-(stations|categories)\/[^/]+$/,
    controller: preparationTaskController,
    requiresAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/preparation-task-(stations|categories)\/[^/]+$/,
    controller: preparationTaskController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/preparation-task-(stations|categories)\/[^/]+$/,
    controller: preparationTaskController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/preparation-tasks$/,
    controller: preparationTaskController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/preparation-tasks$/,
    controller: preparationTaskController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/preparation-tasks\/[^/]+$/,
    controller: preparationTaskController,
    requiresAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/preparation-tasks\/[^/]+$/,
    controller: preparationTaskController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/preparation-tasks\/[^/]+$/,
    controller: preparationTaskController,
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
    method: "PATCH",
    matcher: /^\/drivers\/[^/]+\/activate$/,
    controller: driverController,
    requiresAuth: true,
  },
  {
    method: "PATCH",
    matcher: /^\/drivers\/[^/]+\/deactivate$/,
    controller: driverController,
    requiresAuth: true,
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
    matcher: /^\/businesses\/current$/,
    controller: getCurrentBusinessController,
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
    matcher: /^\/orders-by-station$/,
    controller: getOrdersByStationController,
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
    method: "PATCH",
    matcher: /^\/orders\/[^/]+$/,
    controller: manageOrdersController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/orders$/,
    controller: manageOrdersController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/drivers\/orders\/[^/]+$/,
    controller: updateOrderController,
    requiresAuth: false,
    requiresDriverAuth: true,
    bodyMode: "json",
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
    method: "GET",
    matcher: /^\/pos\/exclusive-promotions$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/progressive-discount$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/customers\/search$/,
    controller: nativeCatalogController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/customers$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/address-search$/,
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
  const requestId = randomUUID();
  const startedAt = Date.now();

  const sendJsonWithLog = (statusCode: number, payload: unknown) => {
    const durationMs = Date.now() - startedAt;
    console.log("[api] response sent", {
      requestId,
      method: method ?? "UNKNOWN",
      url: url ?? "UNKNOWN",
      statusCode,
      durationMs,
      body: formatPayloadForLog(payload),
    });
    sendJson(response, statusCode, payload);
  };

  if (!method || !url) {
    sendJsonWithLog(400, { error: "Invalid request" });
    return;
  }

  console.log("[api] call received", {
    requestId,
    method,
    url,
  });

  if (method === "OPTIONS") {
    setCorsHeaders(response);
    response.writeHead(204);
    response.end();
    return;
  }

  const parsedUrl = new URL(url, "http://localhost");
  const path = normalizeApiPath(parsedUrl.pathname);

  if (method === "GET" && path === "/health") {
    sendJsonWithLog(200, {
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
    sendJsonWithLog(404, { error: "Not found" });
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
      sendJsonWithLog(401, { error: "Unauthorized" });
      return;
    }

    driverAuth = tokenPayload;
  } else if (route.requiresAuth) {
    const accessToken = extractAccessToken(request);
    const tokenPayload = accessToken ? accessTokenVerifier.verify(accessToken) : null;
    if (!tokenPayload) {
      sendJsonWithLog(401, { error: "Unauthorized" });
      return;
    }

    const requestedBusinessId = extractBusinessId(request, parsedUrl);
    const businessContext = await resolveBusinessIdForUser(
      tokenPayload.userId,
      requestedBusinessId,
    );

    if (businessContext === "__forbidden__") {
      sendJsonWithLog(403, {
        error: "Forbidden",
        reason: "BUSINESS_ACCESS_DENIED",
      });
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

    if (isDevLoggingEnabled) {
      console.log("[api] body sent to request", {
        requestId,
        method,
        url,
        body: formatRequestBodyForLog({
          body,
          formData,
          rawBody,
        }),
      });
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

    sendJsonWithLog(result.statusCode, result.body);
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      sendJsonWithLog(413, { error: "Payload too large" });
      return;
    }

    if (error instanceof Error && error.message === "INVALID_JSON") {
      sendJsonWithLog(400, { error: "Invalid JSON payload" });
      return;
    }

    if (error instanceof Error && error.message === "INVALID_FORM_DATA") {
      sendJsonWithLog(400, { error: "Invalid multipart form-data payload" });
      return;
    }

    console.error("[api] request failed", {
      requestId,
      method: method ?? "UNKNOWN",
      url: url ?? "UNKNOWN",
      error,
    });
    sendJsonWithLog(500, { error: "Internal Server Error" });
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

function formatPayloadForLog(payload: unknown): unknown {
  if (typeof payload === "string") {
    return payload.length > 1000 ? `${payload.slice(0, 1000)}...[truncated]` : payload;
  }

  try {
    const serialized = JSON.stringify(payload);
    if (!serialized) {
      return payload;
    }

    return serialized.length > 2000
      ? `${serialized.slice(0, 2000)}...[truncated]`
      : payload;
  } catch {
    return "[unserializable payload]";
  }
}

function formatRequestBodyForLog(input: {
  body: unknown;
  formData?: FormData;
  rawBody?: Buffer;
}): unknown {
  const { body, formData, rawBody } = input;

  if (formData) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        data[key] = {
          fileName: value.name,
          fileSize: value.size,
          fileType: value.type || "application/octet-stream",
        };
      } else {
        data[key] = value;
      }
    }
    return { type: "form-data", data };
  }

  if (rawBody) {
    return {
      type: "raw",
      size: rawBody.length,
      preview: rawBody.toString("utf8", 0, Math.min(300, rawBody.length)),
    };
  }

  return body ?? {};
}

function normalizeApiPath(pathname: string): string {
  if (pathname === "/api") {
    return "/";
  }

  if (pathname.startsWith("/api/")) {
    const normalized = pathname.slice("/api".length);
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  return pathname;
}
