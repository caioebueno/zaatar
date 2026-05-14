-- Normalize inventory timestamptz precision to (6) to match live DB.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryPlace'
      AND column_name = 'createdAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryPlace" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryPlace'
      AND column_name = 'updatedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryPlace" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryProduct'
      AND column_name = 'createdAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryProduct" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryProduct'
      AND column_name = 'updatedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryProduct" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStock'
      AND column_name = 'createdAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStock" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStock'
      AND column_name = 'updatedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStock" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStock'
      AND column_name = 'lastCheckedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStock" ALTER COLUMN "lastCheckedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklist'
      AND column_name = 'createdAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklist'
      AND column_name = 'updatedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklist'
      AND column_name = 'submittedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklist" ALTER COLUMN "submittedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklistItem'
      AND column_name = 'createdAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklistItem'
      AND column_name = 'updatedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryChecklistItem'
      AND column_name = 'checkedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "checkedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'createdAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'updatedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'triggeredAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "triggeredAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'ackedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "ackedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryAlert'
      AND column_name = 'resolvedAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryAlert" ALTER COLUMN "resolvedAt" TYPE TIMESTAMPTZ(6)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'InventoryStockEvent'
      AND column_name = 'createdAt'
      AND udt_name = 'timestamptz'
      AND COALESCE(datetime_precision, -1) <> 6
  ) THEN
    EXECUTE 'ALTER TABLE "InventoryStockEvent" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6)';
  END IF;
END $$;
