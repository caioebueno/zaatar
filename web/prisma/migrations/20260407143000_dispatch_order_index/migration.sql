ALTER TABLE "Order"
ADD COLUMN "dispatchOrderIndex" INTEGER;

CREATE INDEX "Order_dispatchId_dispatchOrderIndex_idx"
ON "Order"("dispatchId", "dispatchOrderIndex");
