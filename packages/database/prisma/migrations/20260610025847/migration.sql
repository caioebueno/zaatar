-- CreateEnum
CREATE TYPE "DispatchRouteMetricsRefreshJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "DispatchRouteMetricsRefreshJob" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "DispatchRouteMetricsRefreshJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "dispatchId" TEXT NOT NULL,

    CONSTRAINT "DispatchRouteMetricsRefreshJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DispatchRouteMetricsRefreshJob_dispatchId_key" ON "DispatchRouteMetricsRefreshJob"("dispatchId");

-- CreateIndex
CREATE INDEX "DispatchRouteMetricsRefreshJob_status_availableAt_createdAt_idx" ON "DispatchRouteMetricsRefreshJob"("status", "availableAt", "createdAt");

-- AddForeignKey
ALTER TABLE "DispatchRouteMetricsRefreshJob" ADD CONSTRAINT "DispatchRouteMetricsRefreshJob_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
