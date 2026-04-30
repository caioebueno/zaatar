-- Reconcile manual/runtime inventory schema changes with Prisma migration history
-- Safe for production: idempotent and non-destructive

-- Add missing columns introduced outside Prisma migrations
ALTER TABLE "InventoryChecklistItem"
  ADD COLUMN IF NOT EXISTS "outOfStock" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "InventoryStock"
  ADD COLUMN IF NOT EXISTS "minQuantity" INTEGER NOT NULL DEFAULT 0;

-- Backfill stock minimum from product minimum for existing rows
UPDATE "InventoryStock" s
SET "minQuantity" = p."minQuantity"
FROM "InventoryProduct" p
WHERE s."productId" = p."id"
  AND s."minQuantity" = 0
  AND p."minQuantity" > 0;

-- Ensure updatedAt has DB defaults for raw inserts
ALTER TABLE "InventoryPlace" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "InventoryProduct" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "InventoryStock" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "InventoryChecklist" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "InventoryAlert" ALTER COLUMN "updatedAt" SET DEFAULT now();

-- Normalize index name to match desired naming in schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'InventoryAlert_status_type_idx'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'InventoryAlert_status_idx'
  ) THEN
    ALTER INDEX "InventoryAlert_status_type_idx" RENAME TO "InventoryAlert_status_idx";
  END IF;
END $$;
