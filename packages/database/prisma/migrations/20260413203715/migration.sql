-- AlterTable
ALTER TABLE "Dispatch" ADD COLUMN     "queueIndex" INTEGER;

-- CreateIndex
CREATE INDEX "Dispatch_queueIndex_idx" ON "Dispatch"("queueIndex");
