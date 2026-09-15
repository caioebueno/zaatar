CREATE TYPE "DispatchWhatsAppJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "DispatchWhatsAppJob" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "DispatchWhatsAppJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "orderId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  CONSTRAINT "DispatchWhatsAppJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DispatchWhatsAppJob_orderId_kind_key" ON "DispatchWhatsAppJob" ("orderId", "kind");
CREATE INDEX "DispatchWhatsAppJob_status_availableAt_createdAt_idx" ON "DispatchWhatsAppJob" ("status", "availableAt", "createdAt");
