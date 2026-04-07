ALTER TABLE "Dispatch"
ADD COLUMN "dispatchAt" TIMESTAMP(3);

ALTER TABLE "Order"
ADD COLUMN "deliveredAt" TIMESTAMP(3);

UPDATE "Dispatch"
SET "dispatchAt" = "createdAt"
WHERE "dispatched" = true
  AND "dispatchAt" IS NULL;

UPDATE "Order"
SET "deliveredAt" = "createdAt"
WHERE "status" = 'DELIVERED'
  AND "deliveredAt" IS NULL;
