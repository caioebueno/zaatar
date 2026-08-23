import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type {
  SquareWebhookRunAttemptView,
  SquareWebhookRunRepository,
  SquareWebhookRunStatus,
  SquareWebhookRunView,
} from "../../application/ports/SquareWebhookRunRepository.js";

const RUN_STATUSES: readonly SquareWebhookRunStatus[] = [
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "IGNORED",
  "DUPLICATE_SKIPPED",
];

/**
 * Read API for inbound Square webhook runs (the "Square webhooks" screen):
 *   GET /integrations/square/webhook-runs           — recent runs (list view)
 *   GET /integrations/square/webhook-runs/:runId     — one run + delivery log
 */
export class SquareWebhookRunController implements HttpController {
  constructor(private readonly repository: SquareWebhookRunRepository) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.auth?.userId) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }

    const businessId = request.auth.businessId?.trim() ?? "";
    if (!businessId) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "businessId" },
      };
    }

    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;
    const prefix = "/integrations/square/webhook-runs";

    if (request.method === "GET" && pathname.startsWith(`${prefix}/`)) {
      const runId = decodeURIComponent(pathname.slice(`${prefix}/`.length)).trim();
      if (!runId) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload", field: "runId" },
        };
      }

      const run = await this.repository.findById({ businessId, runId });
      if (!run) {
        return { statusCode: 404, body: { error: "SQUARE_WEBHOOK_RUN_NOT_FOUND" } };
      }

      return { statusCode: 200, body: { run: serializeRunDetail(run) } };
    }

    if (request.method === "GET" && pathname === prefix) {
      const limit = parseLimit(url.searchParams.get("limit"));
      const eventType = url.searchParams.get("eventType")?.trim() || undefined;
      const status = parseStatus(url.searchParams.get("status"));

      const runs = await this.repository.listRuns({
        businessId,
        eventType,
        limit,
        status,
      });

      return {
        statusCode: 200,
        body: {
          runs: runs.map(serializeRunSummary),
          limit,
          eventType: eventType ?? null,
          status: status ?? null,
        },
      };
    }

    return { statusCode: 404, body: { error: "Not found" } };
  }
}

function parseLimit(rawValue: string | null): number {
  const parsed = Number.parseInt(rawValue?.trim() ?? "", 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 50;
  }
  return Math.min(parsed, 100);
}

function parseStatus(rawValue: string | null): SquareWebhookRunStatus | undefined {
  const value = rawValue?.trim().toUpperCase();
  return RUN_STATUSES.find((status) => status === value);
}

/** Human-friendly badge label for a run's terminal state (action refines SUCCESS). */
function resultLabel(status: SquareWebhookRunStatus, action: string | null): string {
  switch (status) {
    case "SUCCESS":
      return action === "updated" ? "Order updated" : "Order created";
    case "FAILED":
      return "Failed";
    case "DUPLICATE_SKIPPED":
      return "Duplicate - skipped";
    case "IGNORED":
      return "Ignored";
    case "PROCESSING":
      return "Processing";
    default:
      return status;
  }
}

/** Best payload to preview: the retrieved Square order object, else the raw webhook body. */
function bestPayload(source: { squareOrderPayload: unknown; webhookPayload: unknown }): unknown {
  return source.squareOrderPayload ?? source.webhookPayload ?? null;
}

function serializeRunSummary(run: SquareWebhookRunView) {
  return {
    id: run.id,
    eventId: run.eventId,
    eventType: run.eventType,
    squareOrderId: run.squareOrderId,
    locationId: run.locationId,
    merchantId: run.merchantId,
    squareOrderState: run.squareOrderState,
    status: run.status,
    action: run.action,
    reason: run.reason,
    resultLabel: resultLabel(run.status, run.action),
    foodyOrderId: run.foodyOrderId,
    attempts: run.attemptsCount,
    signatureVerified: run.signatureVerified,
    firstReceivedAt: run.firstReceivedAt.toISOString(),
    lastReceivedAt: run.lastReceivedAt.toISOString(),
    processedAt: run.processedAt?.toISOString() ?? null,
    processingDurationMs: run.processingDurationMs,
    httpStatusCode: run.httpStatusCode,
    errorMessage: run.errorMessage,
    payload: bestPayload(run),
    webhookPayload: run.webhookPayload ?? null,
    squareOrderPayload: run.squareOrderPayload ?? null,
    responsePayload: run.responsePayload ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}

function serializeRunDetail(run: SquareWebhookRunView) {
  return {
    ...serializeRunSummary(run),
    deliveryLog: (run.attempts ?? []).map(serializeAttempt),
  };
}

function serializeAttempt(attempt: SquareWebhookRunAttemptView) {
  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    action: attempt.action,
    reason: attempt.reason,
    message: attempt.errorMessage ?? attempt.reason ?? null,
    receivedAt: attempt.receivedAt.toISOString(),
    finishedAt: attempt.finishedAt?.toISOString() ?? null,
    processingDurationMs: attempt.processingDurationMs,
    httpStatusCode: attempt.httpStatusCode,
    signatureVerified: attempt.signatureVerified,
    errorMessage: attempt.errorMessage,
    requestHeaders: attempt.requestHeaders ?? null,
    payload: bestPayload(attempt),
    webhookPayload: attempt.webhookPayload ?? null,
    squareOrderPayload: attempt.squareOrderPayload ?? null,
    responsePayload: attempt.responsePayload ?? null,
    createdAt: attempt.createdAt.toISOString(),
  };
}
