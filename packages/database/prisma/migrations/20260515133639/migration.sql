-- CreateEnum
CREATE TYPE "DispatchRouteSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DispatchRoutePointSource" AS ENUM ('GPS', 'NETWORK', 'MANUAL');

-- CreateTable
CREATE TABLE "DispatchRouteSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "DispatchRouteSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalDistanceMeters" INTEGER,
    "durationSeconds" INTEGER,
    "polyline" TEXT,

    CONSTRAINT "DispatchRouteSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchRoutePoint" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracyMeters" INTEGER,
    "speedMps" DOUBLE PRECISION,
    "headingDegrees" DOUBLE PRECISION,
    "altitudeMeters" DOUBLE PRECISION,
    "source" "DispatchRoutePointSource" NOT NULL DEFAULT 'GPS',
    "isMocked" BOOLEAN,

    CONSTRAINT "DispatchRoutePoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchRouteSession_dispatchId_status_idx" ON "DispatchRouteSession"("dispatchId", "status");

-- CreateIndex
CREATE INDEX "DispatchRouteSession_driverId_status_idx" ON "DispatchRouteSession"("driverId", "status");

-- CreateIndex
CREATE INDEX "DispatchRouteSession_dispatchId_driverId_createdAt_idx" ON "DispatchRouteSession"("dispatchId", "driverId", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchRoutePoint_sessionId_recordedAt_idx" ON "DispatchRoutePoint"("sessionId", "recordedAt");

-- CreateIndex
CREATE INDEX "DispatchRoutePoint_sessionId_createdAt_idx" ON "DispatchRoutePoint"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchRoutePoint_sessionId_sequence_key" ON "DispatchRoutePoint"("sessionId", "sequence");

-- AddForeignKey
ALTER TABLE "DispatchRouteSession" ADD CONSTRAINT "DispatchRouteSession_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRouteSession" ADD CONSTRAINT "DispatchRouteSession_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchRoutePoint" ADD CONSTRAINT "DispatchRoutePoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DispatchRouteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
