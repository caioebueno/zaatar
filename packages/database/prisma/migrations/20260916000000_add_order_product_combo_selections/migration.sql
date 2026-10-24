ALTER TABLE "OrderProducts"
ADD COLUMN "comboProductId" TEXT;

ALTER TABLE "OrderProducts"
ADD CONSTRAINT "OrderProducts_comboProductId_fkey"
FOREIGN KEY ("comboProductId") REFERENCES "OrderProducts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "OrderProducts_comboProductId_idx"
ON "OrderProducts"("comboProductId");
