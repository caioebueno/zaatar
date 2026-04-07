CREATE TYPE "DispatchAssignmentJobStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

CREATE TABLE "DispatchAssignmentJob" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "DispatchAssignmentJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "orderId" TEXT NOT NULL,
  "deliveryAddressId" TEXT NOT NULL,

  CONSTRAINT "DispatchAssignmentJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DispatchAssignmentJob_orderId_key"
ON "DispatchAssignmentJob"("orderId");

CREATE INDEX "DispatchAssignmentJob_status_availableAt_idx"
ON "DispatchAssignmentJob"("status", "availableAt");
