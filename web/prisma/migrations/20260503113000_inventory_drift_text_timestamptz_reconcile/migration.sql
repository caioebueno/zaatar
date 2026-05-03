-- Reconcile inventory schema drift without data loss.
-- Aligns migration history with live DB shape:
-- - timestamp(3) -> timestamptz(3)
-- - enum columns -> text columns
-- - FK ON UPDATE behavior -> NO ACTION
-- - inventory index names

SET TIME ZONE 'UTC';

DO $$
BEGIN
  -- InventoryPlace timestamps + text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryPlace'
      AND column_name = 'createdAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryPlace" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryPlace'
      AND column_name = 'updatedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryPlace" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryPlace'
      AND column_name = 'type' AND udt_name <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryPlace" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT';
  END IF;

  -- InventoryProduct timestamps
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryProduct'
      AND column_name = 'createdAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryProduct" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryProduct'
      AND column_name = 'updatedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryProduct" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE ''UTC''';
  END IF;

  -- InventoryStock timestamps
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStock'
      AND column_name = 'createdAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStock" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStock'
      AND column_name = 'updatedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStock" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStock'
      AND column_name = 'lastCheckedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStock" ALTER COLUMN "lastCheckedAt" TYPE TIMESTAMPTZ(3) USING "lastCheckedAt" AT TIME ZONE ''UTC''';
  END IF;

  -- InventoryChecklist timestamps + text status
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklist'
      AND column_name = 'createdAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklist'
      AND column_name = 'updatedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklist'
      AND column_name = 'submittedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "submittedAt" TYPE TIMESTAMPTZ(3) USING "submittedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklist'
      AND column_name = 'status' AND udt_name <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "status" DROP DEFAULT';
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT';
  END IF;

  EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "status" SET DEFAULT ''OPEN''';

  -- InventoryChecklistItem timestamps + text result
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklistItem'
      AND column_name = 'createdAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklistItem'
      AND column_name = 'updatedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklistItem'
      AND column_name = 'checkedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "checkedAt" TYPE TIMESTAMPTZ(3) USING "checkedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklistItem'
      AND column_name = 'result' AND udt_name <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "result" DROP DEFAULT';
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "result" TYPE TEXT USING "result"::TEXT';
  END IF;

  EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "result" SET DEFAULT ''PENDING''';

  -- InventoryAlert timestamps + text enums
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'createdAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'updatedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'triggeredAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "triggeredAt" TYPE TIMESTAMPTZ(3) USING "triggeredAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'ackedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "ackedAt" TYPE TIMESTAMPTZ(3) USING "ackedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'resolvedAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "resolvedAt" TYPE TIMESTAMPTZ(3) USING "resolvedAt" AT TIME ZONE ''UTC''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'type' AND udt_name <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'severity' AND udt_name <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "severity" TYPE TEXT USING "severity"::TEXT';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'status' AND udt_name <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "status" DROP DEFAULT';
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT';
  END IF;

  EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "status" SET DEFAULT ''OPEN''';

  -- InventoryStockEvent timestamps
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStockEvent'
      AND column_name = 'createdAt' AND udt_name <> 'timestamptz'
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStockEvent" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE ''UTC''';
  END IF;
END $$;

-- Align FK definitions (ON UPDATE NO ACTION)
ALTER TABLE "InventoryStock" DROP CONSTRAINT IF EXISTS "InventoryStock_placeId_fkey";
ALTER TABLE "InventoryStock" DROP CONSTRAINT IF EXISTS "InventoryStock_productId_fkey";
ALTER TABLE "InventoryChecklistItem" DROP CONSTRAINT IF EXISTS "InventoryChecklistItem_checklistId_fkey";
ALTER TABLE "InventoryChecklistItem" DROP CONSTRAINT IF EXISTS "InventoryChecklistItem_placeId_fkey";
ALTER TABLE "InventoryChecklistItem" DROP CONSTRAINT IF EXISTS "InventoryChecklistItem_productId_fkey";
ALTER TABLE "InventoryAlert" DROP CONSTRAINT IF EXISTS "InventoryAlert_checklistId_fkey";
ALTER TABLE "InventoryAlert" DROP CONSTRAINT IF EXISTS "InventoryAlert_checklistItemId_fkey";
ALTER TABLE "InventoryAlert" DROP CONSTRAINT IF EXISTS "InventoryAlert_placeId_fkey";
ALTER TABLE "InventoryAlert" DROP CONSTRAINT IF EXISTS "InventoryAlert_productId_fkey";
ALTER TABLE "InventoryStockEvent" DROP CONSTRAINT IF EXISTS "InventoryStockEvent_placeId_fkey";
ALTER TABLE "InventoryStockEvent" DROP CONSTRAINT IF EXISTS "InventoryStockEvent_productId_fkey";

ALTER TABLE "InventoryStock"
  ADD CONSTRAINT "InventoryStock_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "InventoryStock"
  ADD CONSTRAINT "InventoryStock_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "InventoryChecklistItem"
  ADD CONSTRAINT "InventoryChecklistItem_checklistId_fkey"
  FOREIGN KEY ("checklistId") REFERENCES "InventoryChecklist"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "InventoryChecklistItem"
  ADD CONSTRAINT "InventoryChecklistItem_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "InventoryChecklistItem"
  ADD CONSTRAINT "InventoryChecklistItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "InventoryAlert"
  ADD CONSTRAINT "InventoryAlert_checklistId_fkey"
  FOREIGN KEY ("checklistId") REFERENCES "InventoryChecklist"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "InventoryAlert"
  ADD CONSTRAINT "InventoryAlert_checklistItemId_fkey"
  FOREIGN KEY ("checklistItemId") REFERENCES "InventoryChecklistItem"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "InventoryAlert"
  ADD CONSTRAINT "InventoryAlert_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "InventoryAlert"
  ADD CONSTRAINT "InventoryAlert_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "InventoryStockEvent"
  ADD CONSTRAINT "InventoryStockEvent_placeId_fkey"
  FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "InventoryStockEvent"
  ADD CONSTRAINT "InventoryStockEvent_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Normalize index names to current DB naming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'InventoryChecklistItem'
      AND indexname = 'InventoryChecklistItem_checklistId_productId_placeId_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'InventoryChecklistItem'
      AND indexname = 'InventoryChecklistItem_checklist_product_place_key'
  ) THEN
    ALTER INDEX "InventoryChecklistItem_checklistId_productId_placeId_key"
      RENAME TO "InventoryChecklistItem_checklist_product_place_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'InventoryStockEvent'
      AND indexname = 'InventoryStockEvent_placeId_productId_createdAt_idx'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'InventoryStockEvent'
      AND indexname = 'InventoryStockEvent_place_product_createdAt_idx'
  ) THEN
    ALTER INDEX "InventoryStockEvent_placeId_productId_createdAt_idx"
      RENAME TO "InventoryStockEvent_place_product_createdAt_idx";
  END IF;
END $$;
