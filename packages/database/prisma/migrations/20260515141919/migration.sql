-- CreateEnum
CREATE TYPE "DispatchEtaRecalculationJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "DispatchEtaRecalculationJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "DispatchEtaRecalculationJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "dispatchId" TEXT NOT NULL,

    CONSTRAINT "DispatchEtaRecalculationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DispatchEtaRecalculationJob_dispatchId_key" ON "DispatchEtaRecalculationJob"("dispatchId");

-- CreateIndex
CREATE INDEX "DispatchEtaRecalculationJob_status_availableAt_createdAt_idx" ON "DispatchEtaRecalculationJob"("status", "availableAt", "createdAt");

-- AddForeignKey
ALTER TABLE "DispatchEtaRecalculationJob" ADD CONSTRAINT "DispatchEtaRecalculationJob_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
