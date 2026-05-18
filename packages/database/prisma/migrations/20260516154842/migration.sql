-- CreateEnum
CREATE TYPE "DriverActivationStatus" AS ENUM ('ACTIVATED', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DriverActivationEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" TEXT NOT NULL,
    "status" "DriverActivationStatus" NOT NULL,

    CONSTRAINT "DriverActivationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverActivationEvent_driverId_createdAt_idx" ON "DriverActivationEvent"("driverId", "createdAt");

-- AddForeignKey
ALTER TABLE "DriverActivationEvent" ADD CONSTRAINT "DriverActivationEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
