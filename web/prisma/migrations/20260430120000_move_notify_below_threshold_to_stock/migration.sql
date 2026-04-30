-- Move notifyBelowThreshold from InventoryProduct to InventoryStock

ALTER TABLE "InventoryStock"
  ADD COLUMN IF NOT EXISTS "notifyBelowThreshold" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'InventoryProduct'
      AND column_name = 'notifyBelowThreshold'
  ) THEN
    UPDATE "InventoryStock" s
    SET "notifyBelowThreshold" = p."notifyBelowThreshold"
    FROM "InventoryProduct" p
    WHERE s."productId" = p."id";

    ALTER TABLE "InventoryProduct"
      DROP COLUMN IF EXISTS "notifyBelowThreshold";
  END IF;
END $$;
