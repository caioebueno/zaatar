-- CreateEnum
CREATE TYPE "FeedbackWhatsAppJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "FeedbackWhatsAppJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FeedbackWhatsAppJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "orderId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "language" TEXT,

    CONSTRAINT "FeedbackWhatsAppJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackWhatsAppJob_orderId_key" ON "FeedbackWhatsAppJob"("orderId");

-- CreateIndex
CREATE INDEX "FeedbackWhatsAppJob_status_availableAt_idx" ON "FeedbackWhatsAppJob"("status", "availableAt");
