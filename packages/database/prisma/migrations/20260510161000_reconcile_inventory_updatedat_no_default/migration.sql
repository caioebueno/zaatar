-- Reconcile dev drift: Prisma migration history expects NO DEFAULT on these updatedAt columns.
-- This is non-destructive and does not alter data values.

ALTER TABLE "InventoryAlert"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "InventoryChecklist"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "InventoryChecklistItem"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "InventoryPlace"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "InventoryProduct"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "InventoryStock"
  ALTER COLUMN "updatedAt" DROP DEFAULT;
