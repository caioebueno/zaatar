-- AlterTable
ALTER TABLE "PreparationStep" ADD COLUMN     "goalMinutes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PreparationStepCategory" ADD COLUMN     "stationId" TEXT;

-- AlterTable
ALTER TABLE "PreparationStepTrack" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "expectedAt" TIMESTAMP(3),
ADD COLUMN     "goalMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PreparationStepCategory_orderId_stationId_idx" ON "PreparationStepCategory"("orderId", "stationId");

-- AddForeignKey
ALTER TABLE "PreparationStepCategory" ADD CONSTRAINT "PreparationStepCategory_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
