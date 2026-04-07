CREATE TABLE "Dispatch" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dispatched" BOOLEAN NOT NULL DEFAULT false,
  "driverId" TEXT,

  CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order"
ADD COLUMN "dispatchId" TEXT;

ALTER TABLE "Dispatch"
ADD CONSTRAINT "Dispatch_driverId_fkey"
FOREIGN KEY ("driverId") REFERENCES "Driver"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_dispatchId_fkey"
FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Dispatch_driverId_idx" ON "Dispatch"("driverId");
CREATE INDEX "Order_dispatchId_idx" ON "Order"("dispatchId");
