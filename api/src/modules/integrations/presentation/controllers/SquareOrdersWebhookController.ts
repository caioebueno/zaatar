import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type { SquareConnectionRepository } from "../../application/ports/SquareConnectionRepository.js";
import type { SquareWebhookRunRepository } from "../../application/ports/SquareWebhookRunRepository.js";
import {
  HandleSquareOrdersWebhookUseCase,
  SquareOrdersWebhookProcessingError,
} from "../../application/use-cases/HandleSquareOrdersWebhookUseCase.js";
import type { SquareConnectionAccessTokenResolver } from "../../infrastructure/http/SquareConnectionAccessTokenResolver.js";

type SquareWebhookEnvelope = {
  created_at?: string;
  data?: {
    id?: string;
    object?: {
      order_created?: {
        location_id?: string;
        order_id?: string;
        state?: string;
        version?: number;
      };
      order_updated?: {
        location_id?: string;
        order_id?: string;
        state?: string;
        version?: number;
      };
    };
    type?: string;
  };
  event_id?: string;
  merchant_id?: string;
  type?: string;
};

export class SquareOrdersWebhookController implements HttpController {
  constructor(
    private readonly handleSquareOrdersWebhookUseCase: HandleSquareOrdersWebhookUseCase,
    private readonly squareTokenResolver: SquareConnectionAccessTokenResolver,
    private readonly squareConnectionRepository: SquareConnectionRepository,
    private readonly squareWebhookRunRepository: SquareWebhookRunRepository,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");

    if (request.method !== "POST" || url.pathname !== "/webhooks/square/orders") {
      return {
        statusCode: 404,
        body: { error: "Not found" },
      };
    }

    const rawBody = request.rawBody ?? Buffer.from("{}");
    const parsed = parseSquareWebhookBody(rawBody);
    const orderCreated = parsed?.data?.object?.order_created;
    const orderUpdated = parsed?.data?.object?.order_updated;
    const orderDetails = orderCreated ?? orderUpdated ?? null;
    const merchantId = parsed?.merchant_id?.trim() ?? null;
    const businessId = merchantId
      ? (await this.squareConnectionRepository.findByMerchantIdWithSecrets(merchantId))?.businessId ??
        null
      : null;
    const signatureHeader = request.headers?.["x-square-hmacsha256-signature"] ?? null;
    const signatureValidation = validateSquareSignature({
      notificationUrl: resolveSquareWebhookNotificationUrl(request, url),
      rawBody,
      signatureHeader,
      signatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim() ?? null,
    });

    const webhookRun = await this.squareWebhookRunRepository.beginAttempt({
      businessId,
      eventId: parsed?.event_id ?? null,
      eventType: parsed?.type ?? null,
      locationId: orderDetails?.location_id ?? null,
      merchantId,
      requestHeaders: buildWebhookRequestHeaders(request.headers),
      signatureVerified: signatureValidation.verified,
      squareOrderId: orderDetails?.order_id ?? null,
      squareOrderState: orderDetails?.state ?? null,
      webhookPayload: buildStoredWebhookPayload(rawBody, parsed),
    });

    if (!signatureValidation.ok) {
      const responseBody = {
        error: "Invalid Square signature",
      };

      await this.squareWebhookRunRepository.completeAttempt({
        attemptId: webhookRun.attempt.id,
        errorMessage: "INVALID_SIGNATURE",
        httpStatusCode: 403,
        reason: "INVALID_SIGNATURE",
        responsePayload: responseBody,
        runId: webhookRun.run.id,
        signatureVerified: false,
        status: "FAILED",
      });

      return {
        statusCode: 403,
        body: responseBody,
      };
    }

    if (!parsed) {
      const responseBody = {
        error: "Invalid Square webhook payload",
      };

      await this.squareWebhookRunRepository.completeAttempt({
        attemptId: webhookRun.attempt.id,
        errorMessage: "INVALID_WEBHOOK_PAYLOAD",
        httpStatusCode: 400,
        reason: "INVALID_WEBHOOK_PAYLOAD",
        responsePayload: responseBody,
        runId: webhookRun.run.id,
        signatureVerified: signatureValidation.verified,
        status: "FAILED",
      });

      return {
        statusCode: 400,
        body: responseBody,
      };
    }

    if (webhookRun.shouldSkipProcessing) {
      const responseBody = {
        ok: true,
        action: "ignored",
        reason: "DUPLICATE_DELIVERY",
      };

      await this.squareWebhookRunRepository.completeAttempt({
        action: "ignored",
        attemptId: webhookRun.attempt.id,
        httpStatusCode: 200,
        reason: "DUPLICATE_DELIVERY",
        responsePayload: responseBody,
        runId: webhookRun.run.id,
        signatureVerified: signatureValidation.verified,
        status: "DUPLICATE_SKIPPED",
      });

      logSquareOrderWebhook({
        action: "ignored",
        eventId: parsed.event_id ?? null,
        eventType: parsed.type ?? null,
        foodyOrderId: webhookRun.run.foodyOrderId,
        locationId: orderDetails?.location_id ?? null,
        orderId: orderDetails?.order_id ?? null,
        reason: "DUPLICATE_DELIVERY",
        signatureVerified: signatureValidation.verified,
        state: orderDetails?.state ?? null,
      });

      return {
        statusCode: 200,
        body: responseBody,
      };
    }

    let accessToken: string | null = null;

    if (merchantId) {
      try {
        accessToken = await this.squareTokenResolver.resolveForMerchantId(merchantId);
      } catch (error) {
        if (error instanceof Error && error.message === "SQUARE_NOT_CONNECTED") {
          const responseBody = {
            ok: true,
            action: "ignored",
            reason: "MERCHANT_NOT_CONNECTED",
          };

          await this.squareWebhookRunRepository.completeAttempt({
            action: "ignored",
            attemptId: webhookRun.attempt.id,
            httpStatusCode: 202,
            reason: "MERCHANT_NOT_CONNECTED",
            responsePayload: responseBody,
            runId: webhookRun.run.id,
            signatureVerified: signatureValidation.verified,
            status: "IGNORED",
          });

          logSquareOrderWebhook({
            action: "ignored",
            eventId: parsed.event_id ?? null,
            eventType: parsed.type ?? null,
            foodyOrderId: null,
            locationId: orderDetails?.location_id ?? null,
            orderId: orderDetails?.order_id ?? null,
            reason: "MERCHANT_NOT_CONNECTED",
            signatureVerified: signatureValidation.verified,
            state: orderDetails?.state ?? null,
          });

          return {
            statusCode: 202,
            body: responseBody,
          };
        }

        throw error;
      }
    }

    try {
      const syncResult = await this.handleSquareOrdersWebhookUseCase.execute({
        accessToken,
        eventType: parsed.type ?? null,
        squareOrderId: orderDetails?.order_id ?? null,
      });

      const responseBody = {
        ok: true,
        eventId: parsed.event_id ?? null,
        eventType: parsed.type ?? null,
        locationId: orderDetails?.location_id ?? null,
        orderId: orderDetails?.order_id ?? null,
        foodyOrderId: syncResult.foodyOrderId,
        action: syncResult.action,
        reason: syncResult.reason ?? null,
        signatureVerified: signatureValidation.verified,
        state: orderDetails?.state ?? null,
      };

      await this.squareWebhookRunRepository.completeAttempt({
        action: syncResult.action,
        attemptId: webhookRun.attempt.id,
        foodyOrderId: syncResult.foodyOrderId,
        httpStatusCode: 200,
        reason: syncResult.reason ?? null,
        responsePayload: responseBody,
        runId: webhookRun.run.id,
        signatureVerified: signatureValidation.verified,
        squareOrderPayload: syncResult.squareOrderPayload,
        status: syncResult.action === "ignored" ? "IGNORED" : "SUCCESS",
      });

      logSquareOrderWebhook({
        action: syncResult.action,
        eventId: parsed.event_id ?? null,
        eventType: parsed.type ?? null,
        foodyOrderId: syncResult.foodyOrderId,
        locationId: orderDetails?.location_id ?? null,
        orderId: orderDetails?.order_id ?? null,
        reason: syncResult.reason,
        signatureVerified: signatureValidation.verified,
        state: orderDetails?.state ?? null,
      });

      return {
        statusCode: 200,
        body: responseBody,
      };
    } catch (error) {
      const processingError = SquareOrdersWebhookProcessingError.from(error, {
        squareOrderId: orderDetails?.order_id ?? null,
        squareOrderPayload: null,
      });
      const responseBody = {
        error: processingError.message,
      };

      await this.squareWebhookRunRepository.completeAttempt({
        attemptId: webhookRun.attempt.id,
        errorMessage: processingError.message,
        httpStatusCode: 500,
        reason: processingError.message,
        responsePayload: responseBody,
        runId: webhookRun.run.id,
        signatureVerified: signatureValidation.verified,
        squareOrderPayload: processingError.squareOrderPayload,
        status: "FAILED",
      });

      logSquareOrderWebhook({
        action: "ignored",
        eventId: parsed.event_id ?? null,
        eventType: parsed.type ?? null,
        foodyOrderId: null,
        locationId: orderDetails?.location_id ?? null,
        orderId: processingError.squareOrderId,
        reason: processingError.message,
        signatureVerified: signatureValidation.verified,
        state: orderDetails?.state ?? null,
      });

      return {
        statusCode: 500,
        body: responseBody,
      };
    }
  }
}

function parseSquareWebhookBody(rawBody: Buffer): SquareWebhookEnvelope | null {
  try {
    const parsed = JSON.parse(rawBody.toString("utf8")) as SquareWebhookEnvelope;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function buildStoredWebhookPayload(
  rawBody: Buffer,
  parsed: SquareWebhookEnvelope | null,
): unknown {
  if (parsed) {
    return parsed;
  }

  return {
    invalidJson: true,
    rawBodyText: rawBody.toString("utf8"),
  };
}

function buildWebhookRequestHeaders(
  headers: Record<string, string | undefined> | undefined,
): Record<string, string> {
  const selectedHeaders = [
    "content-type",
    "user-agent",
    "x-forwarded-for",
    "x-forwarded-proto",
    "x-square-hmacsha256-signature",
  ];

  const output: Record<string, string> = {};

  for (const headerName of selectedHeaders) {
    const value = headers?.[headerName]?.trim();
    if (value) {
      output[headerName] = value;
    }
  }

  return output;
}

function resolveSquareWebhookNotificationUrl(
  request: HttpRequest,
  url: URL,
): string | null {
  const configured = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL?.trim();
  if (configured) {
    return configured;
  }

  const host = request.headers?.host?.trim();
  if (!host) {
    return null;
  }

  const forwardedProto = request.headers?.["x-forwarded-proto"]?.trim();
  const protocol = forwardedProto || "https";

  return `${protocol}://${host}${url.pathname}`;
}

function validateSquareSignature(input: {
  notificationUrl: string | null;
  rawBody: Buffer;
  signatureHeader: string | null;
  signatureKey: string | null;
}): {
  ok: boolean;
  verified: boolean | null;
} {
  if (!input.signatureKey) {
    return {
      ok: true,
      verified: null,
    };
  }

  if (!input.notificationUrl || !input.signatureHeader) {
    return {
      ok: false,
      verified: false,
    };
  }

  const digest = createHmac("sha256", input.signatureKey)
    .update(input.notificationUrl)
    .update(input.rawBody)
    .digest("base64");

  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(input.signatureHeader, "utf8");

  if (expected.length !== received.length) {
    return {
      ok: false,
      verified: false,
    };
  }

  const isEqual = timingSafeEqual(expected, received);

  return {
    ok: isEqual,
    verified: isEqual,
  };
}

function logSquareOrderWebhook(input: {
  action: "ignored" | "imported" | "updated";
  eventId: string | null;
  eventType: string | null;
  foodyOrderId: string | null;
  locationId: string | null;
  orderId: string | null;
  reason?: string;
  signatureVerified: boolean | null;
  state: string | null;
}) {
  const summary =
    `action=${input.action} ` +
    `eventId=${input.eventId ?? "unknown"} ` +
    `orderId=${input.orderId ?? "unknown"} ` +
    `foodyOrderId=${input.foodyOrderId ?? "none"} ` +
    `locationId=${input.locationId ?? "unknown"} ` +
    `state=${input.state ?? "unknown"} ` +
    `signatureVerified=${input.signatureVerified === null ? "skipped" : String(input.signatureVerified)}` +
    (input.reason ? ` reason=${input.reason}` : "");

  if (input.eventType === "order.created") {
    console.log(`[square-webhook] received order.created ${summary}`);
    return;
  }

  console.log(
    `[square-webhook] received ${input.eventType ?? "unknown-event"} ${summary}`,
  );
}
