CREATE TYPE "OrderAdjustmentType" AS ENUM ('DISCOUNT', 'EXTRA_CHARGE');

CREATE TABLE "OrderAdjustment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "OrderAdjustmentType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OrderAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderAdjustment_orderId_idx" ON "OrderAdjustment"("orderId");
CREATE INDEX "OrderAdjustment_type_idx" ON "OrderAdjustment"("type");

ALTER TABLE "OrderAdjustment"
  ADD CONSTRAINT "OrderAdjustment_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
