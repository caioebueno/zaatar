CREATE TYPE "OrderSourcePlatform" AS ENUM (
  'FOODY',
  'DOORDASH',
  'UBER_EATS',
  'SQUARE',
  'UNKNOWN'
);

ALTER TABLE "Order"
ADD COLUMN "sourcePlatform" "OrderSourcePlatform";

CREATE INDEX "Order_sourcePlatform_idx" ON "Order"("sourcePlatform");
