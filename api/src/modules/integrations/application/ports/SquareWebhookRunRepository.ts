export type SquareWebhookRunStatus =
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "IGNORED"
  | "DUPLICATE_SKIPPED";

export type SquareWebhookRunAttemptView = {
  action: string | null;
  attemptNumber: number;
  createdAt: Date;
  errorMessage: string | null;
  finishedAt: Date | null;
  httpStatusCode: number | null;
  id: string;
  processingDurationMs: number | null;
  reason: string | null;
  receivedAt: Date;
  requestHeaders: unknown;
  responsePayload: unknown;
  runId: string;
  signatureVerified: boolean | null;
  squareOrderPayload: unknown;
  status: SquareWebhookRunStatus;
  webhookPayload: unknown;
};

export type SquareWebhookRunView = {
  action: string | null;
  attempts?: SquareWebhookRunAttemptView[];
  attemptsCount: number;
  businessId: string | null;
  createdAt: Date;
  errorMessage: string | null;
  eventId: string | null;
  eventType: string | null;
  firstReceivedAt: Date;
  foodyOrderId: string | null;
  httpStatusCode: number | null;
  id: string;
  lastReceivedAt: Date;
  locationId: string | null;
  merchantId: string | null;
  processedAt: Date | null;
  processingDurationMs: number | null;
  reason: string | null;
  responsePayload: unknown;
  signatureVerified: boolean | null;
  squareOrderId: string | null;
  squareOrderPayload: unknown;
  squareOrderState: string | null;
  status: SquareWebhookRunStatus;
  updatedAt: Date;
  webhookPayload: unknown;
};

export interface SquareWebhookRunRepository {
  beginAttempt(input: {
    businessId?: string | null;
    eventId?: string | null;
    eventType?: string | null;
    locationId?: string | null;
    merchantId?: string | null;
    requestHeaders?: unknown;
    signatureVerified?: boolean | null;
    squareOrderId?: string | null;
    squareOrderState?: string | null;
    webhookPayload?: unknown;
  }): Promise<{
    attempt: SquareWebhookRunAttemptView;
    run: SquareWebhookRunView;
    shouldSkipProcessing: boolean;
  }>;
  completeAttempt(input: {
    action?: string | null;
    attemptId: string;
    errorMessage?: string | null;
    foodyOrderId?: string | null;
    httpStatusCode: number;
    reason?: string | null;
    responsePayload?: unknown;
    runId: string;
    signatureVerified?: boolean | null;
    squareOrderPayload?: unknown;
    status: SquareWebhookRunStatus;
  }): Promise<void>;
  findById(input: {
    businessId: string;
    runId: string;
  }): Promise<SquareWebhookRunView | null>;
  listRuns(input: {
    businessId: string;
    eventType?: string;
    limit: number;
    status?: SquareWebhookRunStatus;
  }): Promise<SquareWebhookRunView[]>;
}
