import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage } from "node:http";
import { ensureEnvLoaded } from "./shared/env/loadEnv.js";
import { makeNativeCatalogController } from "./modules/catalog/main/makeNativeCatalogController.js";
import { makeLoginOwnerController } from "./modules/owner/main/makeLoginOwnerController.js";
import { makeOwnerAuthController } from "./modules/owner/main/makeOwnerAuthController.js";
import { makeRegisterOwnerController } from "./modules/owner/main/makeRegisterOwnerController.js";
import { makeCreateBusinessController } from "./modules/business/main/makeCreateBusinessController.js";
import { makeBusinessMembersController } from "./modules/business/main/makeBusinessMembersController.js";
import { makeGetCurrentBusinessController } from "./modules/business/main/makeGetCurrentBusinessController.js";
import { makeListOwnedBusinessesController } from "./modules/business/main/makeListOwnedBusinessesController.js";
import { makeGetCurrentBusinessSettingsController } from "./modules/business-settings/main/makeGetCurrentBusinessSettingsController.js";
import { makeGetPublicBusinessSettingsController } from "./modules/business-settings/main/makeGetPublicBusinessSettingsController.js";
import { makeUpdateCurrentBusinessSettingsController } from "./modules/business-settings/main/makeUpdateCurrentBusinessSettingsController.js";
import { makeUberEatsOAuthController } from "./modules/integrations/main/makeUberEatsOAuthController.js";
import { makeChatwootProxyController } from "./modules/integrations/main/makeChatwootProxyController.js";
import { makeSquareCatalogSyncTaskController } from "./modules/integrations/main/makeSquareCatalogSyncTaskController.js";
import { makeSquareMenuSyncController } from "./modules/integrations/main/makeSquareMenuSyncController.js";
import { makeSquareOAuthController } from "./modules/integrations/main/makeSquareOAuthController.js";
import { makeSquareOrdersWebhookController } from "./modules/integrations/main/makeSquareOrdersWebhookController.js";
import { makeSquareWebhookRunController } from "./modules/integrations/main/makeSquareWebhookRunController.js";
import { makeGetOrderSalesAnalyticsController } from "./modules/analytics/main/makeGetOrderSalesAnalyticsController.js";
import { makeGetOrderQuantityAnalyticsController } from "./modules/analytics/main/makeGetOrderQuantityAnalyticsController.js";
import { makeGetRevenueAnalyticsController } from "./modules/analytics/main/makeGetRevenueAnalyticsController.js";
import { makeGetNewCustomersAnalyticsController } from "./modules/analytics/main/makeGetNewCustomersAnalyticsController.js";
import { makeGetAverageTicketAnalyticsController } from "./modules/analytics/main/makeGetAverageTicketAnalyticsController.js";
import { makeGetCustomerRetentionAnalyticsController } from "./modules/analytics/main/makeGetCustomerRetentionAnalyticsController.js";
import { makeListOrdersController } from "./modules/orders/main/makeListOrdersController.js";
import { makeListOrdersV1Controller } from "./modules/orders/main/makeListOrdersV1Controller.js";
import { makeGetOrderByIdController } from "./modules/orders/main/makeGetOrderByIdController.js";
import { makeGetOrdersByStationController } from "./modules/orders/main/makeGetOrdersByStationController.js";
import { makeUpdateOrderController } from "./modules/orders/main/makeUpdateOrderController.js";
import { makeManageOrdersController } from "./modules/orders/main/makeManageOrdersController.js";
import { makeListFeedbackController } from "./modules/feedback/main/makeListFeedbackController.js";
import { makeGetFeedbackAnalyticsController } from "./modules/feedback/main/makeGetFeedbackAnalyticsController.js";
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
import { makeChatwootWebhookController } from "./modules/chatwoot-webhook/main/makeChatwootWebhookController.js";
import { makeOrderIntentController } from "./modules/order-intent/main/makeOrderIntentController.js";
import { makePaymentsController } from "./modules/payments/main/makePaymentsController.js";
import { HmacDriverAccessTokenVerifier } from "./modules/driver/infrastructure/security/HmacDriverAccessTokenVerifier.js";
import { HmacAccessTokenVerifier } from "./modules/owner/infrastructure/security/HmacAccessTokenVerifier.js";
import { chatwootRealtimeHub } from "./shared/realtime/chatwootRealtimeHub.js";
import prisma from "./prisma.js";
import { setCorsHeaders } from "./shared/http/cors.js";
import {
  readFormDataBody,
  sendHttpResponse,
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

const registerOwnerController = makeRegisterOwnerController();
const loginOwnerController = makeLoginOwnerController();
const ownerAuthController = makeOwnerAuthController();
const listOwnedBusinessesController = makeListOwnedBusinessesController();
const createBusinessController = makeCreateBusinessController();
const businessMembersController = makeBusinessMembersController();
const getCurrentBusinessController = makeGetCurrentBusinessController();
const getCurrentBusinessSettingsController = makeGetCurrentBusinessSettingsController();
const getPublicBusinessSettingsController = makeGetPublicBusinessSettingsController();
const updateCurrentBusinessSettingsController =
  makeUpdateCurrentBusinessSettingsController();
const nativeCatalogController = makeNativeCatalogController();
const uberEatsOAuthController = makeUberEatsOAuthController();
const chatwootProxyController = makeChatwootProxyController();
const squareCatalogSyncTaskController = makeSquareCatalogSyncTaskController();
const squareMenuSyncController = makeSquareMenuSyncController();
const squareOAuthController = makeSquareOAuthController();
const squareOrdersWebhookController = makeSquareOrdersWebhookController();
const squareWebhookRunController = makeSquareWebhookRunController();
const getOrderSalesAnalyticsController = makeGetOrderSalesAnalyticsController();
const getOrderQuantityAnalyticsController = makeGetOrderQuantityAnalyticsController();
const getRevenueAnalyticsController = makeGetRevenueAnalyticsController();
const getNewCustomersAnalyticsController = makeGetNewCustomersAnalyticsController();
const getAverageTicketAnalyticsController = makeGetAverageTicketAnalyticsController();
const getCustomerRetentionAnalyticsController = makeGetCustomerRetentionAnalyticsController();
const listOrdersController = makeListOrdersController();
const listOrdersV1Controller = makeListOrdersV1Controller();
const getOrderByIdController = makeGetOrderByIdController();
const getOrdersByStationController = makeGetOrdersByStationController();
const updateOrderController = makeUpdateOrderController();
const manageOrdersController = makeManageOrdersController();
const listFeedbackController = makeListFeedbackController();
const getFeedbackAnalyticsController = makeGetFeedbackAnalyticsController();
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
const chatwootWebhookController = makeChatwootWebhookController();
const orderIntentController = makeOrderIntentController();
const paymentsController = makePaymentsController();
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
    method: "POST",
    matcher: /^\/webhooks\/chatwoot$/,
    controller: chatwootWebhookController,
    requiresAuth: false,
    bodyMode: "raw",
  },
  {
    method: "POST",
    matcher: /^\/webhooks\/square\/orders$/,
    controller: squareOrdersWebhookController,
    requiresAuth: false,
    bodyMode: "raw",
  },
  {
    method: "GET",
    matcher: /^\/public\/order-link\/settings$/,
    controller: getPublicBusinessSettingsController,
    requiresAuth: false,
  },
  {
    method: "GET",
    matcher: /^\/public\/customers\/addresses$/,
    controller: nativeCatalogController,
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
    matcher: /^\/businesses\/current\/members$/,
    controller: businessMembersController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/businesses\/current\/members$/,
    controller: businessMembersController,
    requiresAuth: true,
    bodyMode: "json",
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
    matcher: /^\/v1\/order$/,
    controller: listOrdersV1Controller,
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
    method: "GET",
    matcher: /^\/orders\/[^/]+\/payments$/,
    controller: paymentsController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/orders\/[^/]+\/payments$/,
    controller: paymentsController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/payments\/[^/]+$/,
    controller: paymentsController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "DELETE",
    matcher: /^\/payments\/[^/]+$/,
    controller: paymentsController,
    requiresAuth: true,
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
    method: "GET",
    matcher: /^\/v1\/feedback$/,
    controller: getFeedbackAnalyticsController,
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
    method: "GET",
    matcher: /^\/v1\/analytics\/order-quantity$/,
    controller: getOrderQuantityAnalyticsController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/v1\/analytics\/revenue$/,
    controller: getRevenueAnalyticsController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/v1\/analytics\/new-customers$/,
    controller: getNewCustomersAnalyticsController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/v1\/analytics\/average-ticket$/,
    controller: getAverageTicketAnalyticsController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/v1\/analytics\/customer-retention$/,
    controller: getCustomerRetentionAnalyticsController,
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
    method: "POST",
    matcher: /^\/customers\/[^/]+\/addresses$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "PATCH",
    matcher: /^\/delivery-addresses\/[^/]+$/,
    controller: nativeCatalogController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/order-intents\/upsert$/,
    controller: orderIntentController,
    requiresAuth: false,
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
    matcher: /^\/conversation$/,
    controller: chatwootProxyController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/owners\/me\/push-devices\/ios$/,
    controller: chatwootWebhookController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/conversation\/[^/]+\/messages$/,
    controller: chatwootProxyController,
    requiresAuth: true,
  },
  {
    method: "POST",
    matcher: /^\/conversation\/[^/]+\/messages$/,
    controller: chatwootProxyController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/conversation\/[^/]+\/take-care$/,
    controller: chatwootProxyController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/conversation\/[^/]+\/resolve$/,
    controller: chatwootProxyController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/conversation\/[^/]+\/read$/,
    controller: chatwootProxyController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "POST",
    matcher: /^\/integrations\/square\/menu-sync\/publish-all$/,
    controller: squareMenuSyncController,
    requiresAuth: true,
    bodyMode: "json",
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/catalog-sync-tasks$/,
    controller: squareCatalogSyncTaskController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/catalog-sync-tasks\/[^/]+$/,
    controller: squareCatalogSyncTaskController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/webhook-runs$/,
    controller: squareWebhookRunController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/webhook-runs\/[^/]+$/,
    controller: squareWebhookRunController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/connection$/,
    controller: squareOAuthController,
    requiresAuth: true,
  },
  {
    method: "DELETE",
    matcher: /^\/integrations\/square\/connection$/,
    controller: squareOAuthController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/oauth\/url$/,
    controller: squareOAuthController,
    requiresAuth: true,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/oauth\/exchange$/,
    controller: squareOAuthController,
    requiresAuth: false,
  },
  {
    method: "GET",
    matcher: /^\/integrations\/square\/oauth\/callback$/,
    controller: squareOAuthController,
    requiresAuth: false,
  },
  {
    method: "POST",
    matcher: /^\/integrations\/square\/oauth\/exchange$/,
    controller: squareOAuthController,
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

  const sendJsonWithLog = (statusCode: number, payload: unknown) => {
    sendJson(response, statusCode, payload);
  };

  if (!method || !url) {
    sendJsonWithLog(400, { error: "Invalid request" });
    return;
  }

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

  if (method === "GET" && path === "/conversation/events") {
    const managerAuth = await resolveManagerAuthContext({
      parsedUrl,
      request,
      sendJsonWithLog,
      accessTokenVerifier,
    });
    if (!managerAuth.ok) {
      return;
    }
    if (!managerAuth.auth.businessId) {
      sendJsonWithLog(400, { error: "Invalid payload", field: "businessId" });
      return;
    }

    const branchId = parsedUrl.searchParams.get("branchId")?.trim() ?? "";
    if (!branchId) {
      sendJsonWithLog(400, { error: "Invalid payload", field: "branchId" });
      return;
    }

    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId: managerAuth.auth.businessId ?? null,
      },
      select: { id: true },
    });
    if (!branch) {
      sendJsonWithLog(404, { error: "Branch not found", field: "branchId" });
      return;
    }

    const conversationId =
      parsedUrl.searchParams.get("conversationId")?.trim() || null;
    const afterEventId =
      parsedUrl.searchParams.get("afterEventId")?.trim() ||
      readHeaderValue(request.headers["last-event-id"]);
    const limitRaw = parsedUrl.searchParams.get("limit")?.trim() ?? "";
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 100;

    const events = chatwootRealtimeHub.getBufferedEvents({
      businessId: managerAuth.auth.businessId,
      branchId,
      conversationId,
      afterEventId,
      limit,
    });
    sendJsonWithLog(200, { events });
    return;
  }

  if (method === "GET" && path === "/conversation/stream") {
    const managerAuth = await resolveManagerAuthContext({
      parsedUrl,
      request,
      sendJsonWithLog,
      accessTokenVerifier,
    });
    if (!managerAuth.ok) {
      return;
    }
    if (!managerAuth.auth.businessId) {
      sendJsonWithLog(400, { error: "Invalid payload", field: "businessId" });
      return;
    }

    const branchId = parsedUrl.searchParams.get("branchId")?.trim() ?? "";
    if (!branchId) {
      sendJsonWithLog(400, { error: "Invalid payload", field: "branchId" });
      return;
    }

    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        businessId: managerAuth.auth.businessId ?? null,
      },
      select: { id: true },
    });
    if (!branch) {
      sendJsonWithLog(404, { error: "Branch not found", field: "branchId" });
      return;
    }

    const conversationId =
      parsedUrl.searchParams.get("conversationId")?.trim() || null;
    const afterEventId =
      parsedUrl.searchParams.get("afterEventId")?.trim() ||
      readHeaderValue(request.headers["last-event-id"]);
    setCorsHeaders(response);
    response.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });

    response.write(`event: ready\n`);
    response.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

    const backlog = chatwootRealtimeHub.getBufferedEvents({
      businessId: managerAuth.auth.businessId,
      branchId,
      conversationId,
      afterEventId,
      limit: 200,
    });
    for (const event of backlog) {
      response.write(`id: ${event.id}\n`);
      response.write(`event: chatwoot_event\n`);
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const unsubscribe = chatwootRealtimeHub.subscribe({
      businessId: managerAuth.auth.businessId,
      branchId,
      conversationId,
      response,
    });

    let closed = false;
    const handleClose = () => {
      if (closed) return;
      closed = true;
      unsubscribe();
    };

    request.on("close", handleClose);
    response.on("close", handleClose);
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
        businessRole?: string | null;
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
      businessId: businessContext.businessId,
      businessRole: businessContext.businessRole,
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
    const incomingChatwootSignatureHeader = readHeaderValue(
      request.headers["x-chatwoot-signature"],
    );
    const incomingChatwootTokenHeader = readHeaderValue(
      request.headers["x-chatwoot-token"],
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
        host: readHeaderValue(request.headers.host) ?? undefined,
        origin: readHeaderValue(request.headers.origin) ?? undefined,
        [BUSINESS_ID_HEADER_NAME]:
          auth?.businessId ?? incomingBusinessIdHeader ?? undefined,
        "x-forwarded-host": readHeaderValue(request.headers["x-forwarded-host"]) ?? undefined,
        "x-forwarded-proto":
          readHeaderValue(request.headers["x-forwarded-proto"]) ?? undefined,
        "x-chatwoot-signature": incomingChatwootSignatureHeader ?? undefined,
        "x-chatwoot-token": incomingChatwootTokenHeader ?? undefined,
      },
    });

    sendHttpResponse(response, result);
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

server.listen(port);

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
): Promise<
  | {
      businessId: string | null;
      businessRole: string | null;
    }
  | "__forbidden__"
> {
  const memberships = await prisma.businessMember.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    select: {
      businessId: true,
      role: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (memberships.length === 0) {
    return {
      businessId: null,
      businessRole: null,
    };
  }

  if (requestedBusinessId) {
    const allowedMembership = memberships.find(
      (item) => item.businessId.trim() === requestedBusinessId.trim(),
    );
    return allowedMembership
      ? {
          businessId: requestedBusinessId,
          businessRole: allowedMembership.role,
        }
      : "__forbidden__";
  }

  return {
    businessId: memberships[0]?.businessId ?? null,
    businessRole: memberships[0]?.role ?? null,
  };
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

async function resolveManagerAuthContext(input: {
  parsedUrl: URL;
  request: IncomingMessage;
  sendJsonWithLog: (statusCode: number, payload: unknown) => void;
  accessTokenVerifier: HmacAccessTokenVerifier;
}): Promise<
  | {
      ok: true;
      auth: {
        businessId?: string | null;
        businessRole?: string | null;
        email: string;
        name: string;
        userId: string;
      };
    }
  | { ok: false }
> {
  const accessToken = extractAccessToken(input.request);
  const tokenPayload = accessToken
    ? input.accessTokenVerifier.verify(accessToken)
    : null;
  if (!tokenPayload) {
    input.sendJsonWithLog(401, { error: "Unauthorized" });
    return { ok: false };
  }

  const requestedBusinessId = extractBusinessId(input.request, input.parsedUrl);
  const businessContext = await resolveBusinessIdForUser(
    tokenPayload.userId,
    requestedBusinessId,
  );

  if (businessContext === "__forbidden__") {
    input.sendJsonWithLog(403, {
      error: "Forbidden",
      reason: "BUSINESS_ACCESS_DENIED",
    });
    return { ok: false };
  }

  return {
    ok: true,
    auth: {
      ...tokenPayload,
      businessId: businessContext.businessId,
      businessRole: businessContext.businessRole,
    },
  };
}
