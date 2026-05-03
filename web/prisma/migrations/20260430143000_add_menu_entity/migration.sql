-- Add Menu entity and attach Category sections to Menu

CREATE TABLE IF NOT EXISTS "Menu" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Menu"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Menu_isDefault_idx"
  ON "Menu"("isDefault");

INSERT INTO "Menu" ("id", "name", "active", "isDefault")
VALUES ('default', 'Default Menu', true, true)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "menuId" TEXT;

UPDATE "Category"
SET "menuId" = 'default'
WHERE "menuId" IS NULL OR BTRIM("menuId") = '';

ALTER TABLE "Category"
  ALTER COLUMN "menuId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Category_menuId_fkey'
      AND conrelid = '"Category"'::regclass
  ) THEN
    ALTER TABLE "Category"
      ADD CONSTRAINT "Category_menuId_fkey"
      FOREIGN KEY ("menuId") REFERENCES "Menu"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "Category_menuIndex_idx";

CREATE INDEX IF NOT EXISTS "Category_menuId_menuIndex_idx"
  ON "Category"("menuId", "menuIndex");
