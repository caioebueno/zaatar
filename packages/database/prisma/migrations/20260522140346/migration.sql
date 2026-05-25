/*
  Warnings:

  - You are about to alter the column `accuracyMeters` on the `DispatchRoutePoint` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- CreateEnum
CREATE TYPE "DispatchRouteMilestoneType" AS ENUM ('LEFT_PIZZERIA');

-- AlterTable
ALTER TABLE "Dispatch" ADD COLUMN     "currentEstimatedDeliveryDurationMinutes" INTEGER,
ADD COLUMN     "currentEstimatedRoundTripDurationMinutes" INTEGER;

-- AlterTable
ALTER TABLE "DispatchRoutePoint" ALTER COLUMN "accuracyMeters" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "currentEstimatedDeliveryDurationMinutes" INTEGER;

-- CreateTable
CREATE TABLE "DispatchRouteMilestone" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "DispatchRouteMilestoneType" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DispatchRouteMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchRouteMilestone_dispatchId_recordedAt_idx" ON "DispatchRouteMilestone"("dispatchId", "recordedAt");

-- CreateIndex
CREATE INDEX "DispatchRouteMilestone_driverId_recordedAt_idx" ON "DispatchRouteMilestone"("driverId", "recordedAt");

-- CreateIndex
CREATE INDEX "DispatchRouteMilestone_sessionId_recordedAt_idx" ON "DispatchRouteMilestone"("sessionId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchRouteMilestone_dispatchId_type_key" ON "DispatchRouteMilestone"("dispatchId", "type");

-- AddForeignKey
ALTER TABLE "DispatchRouteMilestone" ADD CONSTRAINT "DispatchRouteMilestone_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRouteMilestone" ADD CONSTRAINT "DispatchRouteMilestone_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRouteMilestone" ADD CONSTRAINT "DispatchRouteMilestone_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DispatchRouteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
