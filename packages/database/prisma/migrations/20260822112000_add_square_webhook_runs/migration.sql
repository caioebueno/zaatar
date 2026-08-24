CREATE TYPE "SquareWebhookRunStatus" AS ENUM (
  'PROCESSING',
  'SUCCESS',
  'FAILED',
  'IGNORED',
  'DUPLICATE_SKIPPED'
);

CREATE TABLE "SquareWebhookRun" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "businessId" TEXT,
  "eventId" TEXT,
  "eventType" TEXT,
  "merchantId" TEXT,
  "squareOrderId" TEXT,
  "locationId" TEXT,
  "squareOrderState" TEXT,
  "signatureVerified" BOOLEAN,
  "status" "SquareWebhookRunStatus" NOT NULL DEFAULT 'PROCESSING',
  "action" TEXT,
  "reason" TEXT,
  "foodyOrderId" TEXT,
  "firstReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "processingDurationMs" INTEGER,
  "attemptsCount" INTEGER NOT NULL DEFAULT 0,
  "httpStatusCode" INTEGER,
  "errorMessage" TEXT,
  "webhookPayload" JSONB,
  "squareOrderPayload" JSONB,
  "responsePayload" JSONB,

  CONSTRAINT "SquareWebhookRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SquareWebhookRunAttempt" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "runId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "processingDurationMs" INTEGER,
  "httpStatusCode" INTEGER,
  "status" "SquareWebhookRunStatus" NOT NULL DEFAULT 'PROCESSING',
  "action" TEXT,
  "reason" TEXT,
  "signatureVerified" BOOLEAN,
  "errorMessage" TEXT,
  "requestHeaders" JSONB,
  "webhookPayload" JSONB,
  "squareOrderPayload" JSONB,
  "responsePayload" JSONB,

  CONSTRAINT "SquareWebhookRunAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SquareWebhookRun_eventId_key"
ON "SquareWebhookRun"("eventId");

CREATE INDEX "SquareWebhookRun_businessId_createdAt_idx"
ON "SquareWebhookRun"("businessId", "createdAt");

CREATE INDEX "SquareWebhookRun_businessId_status_createdAt_idx"
ON "SquareWebhookRun"("businessId", "status", "createdAt");

CREATE INDEX "SquareWebhookRun_eventType_createdAt_idx"
ON "SquareWebhookRun"("eventType", "createdAt");

CREATE INDEX "SquareWebhookRun_squareOrderId_createdAt_idx"
ON "SquareWebhookRun"("squareOrderId", "createdAt");

CREATE UNIQUE INDEX "SquareWebhookRunAttempt_runId_attemptNumber_key"
ON "SquareWebhookRunAttempt"("runId", "attemptNumber");

CREATE INDEX "SquareWebhookRunAttempt_runId_receivedAt_idx"
ON "SquareWebhookRunAttempt"("runId", "receivedAt");

ALTER TABLE "SquareWebhookRun"
ADD CONSTRAINT "SquareWebhookRun_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SquareWebhookRunAttempt"
ADD CONSTRAINT "SquareWebhookRunAttempt_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "SquareWebhookRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
