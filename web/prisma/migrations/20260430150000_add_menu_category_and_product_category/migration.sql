-- Enable many-to-many:
-- - products <-> categories (sections)
-- - categories (sections) <-> menus

CREATE TABLE IF NOT EXISTS "MenuCategory" (
  "menuId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "menuIndex" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("menuId", "categoryId")
);

CREATE TABLE IF NOT EXISTS "ProductCategory" (
  "productId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "categoryIndex" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId", "categoryId")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MenuCategory_menuId_fkey'
      AND conrelid = '"MenuCategory"'::regclass
  ) THEN
    ALTER TABLE "MenuCategory"
      ADD CONSTRAINT "MenuCategory_menuId_fkey"
      FOREIGN KEY ("menuId") REFERENCES "Menu"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'MenuCategory_categoryId_fkey'
      AND conrelid = '"MenuCategory"'::regclass
  ) THEN
    ALTER TABLE "MenuCategory"
      ADD CONSTRAINT "MenuCategory_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductCategory_productId_fkey'
      AND conrelid = '"ProductCategory"'::regclass
  ) THEN
    ALTER TABLE "ProductCategory"
      ADD CONSTRAINT "ProductCategory_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductCategory_categoryId_fkey'
      AND conrelid = '"ProductCategory"'::regclass
  ) THEN
    ALTER TABLE "ProductCategory"
      ADD CONSTRAINT "ProductCategory_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MenuCategory_menuId_menuIndex_idx"
  ON "MenuCategory"("menuId", "menuIndex");

CREATE INDEX IF NOT EXISTS "MenuCategory_categoryId_idx"
  ON "MenuCategory"("categoryId");

CREATE INDEX IF NOT EXISTS "ProductCategory_categoryId_categoryIndex_idx"
  ON "ProductCategory"("categoryId", "categoryIndex");

CREATE INDEX IF NOT EXISTS "ProductCategory_productId_idx"
  ON "ProductCategory"("productId");

-- Backfill from legacy single-link columns
INSERT INTO "MenuCategory" ("menuId", "categoryId", "menuIndex")
SELECT c."menuId", c."id", c."menuIndex"
FROM "Category" c
WHERE c."menuId" IS NOT NULL
ON CONFLICT ("menuId", "categoryId") DO UPDATE
SET "menuIndex" = EXCLUDED."menuIndex";

INSERT INTO "ProductCategory" ("productId", "categoryId", "categoryIndex")
SELECT p."id", p."categoryId", p."categoryIndex"
FROM "Product" p
WHERE p."categoryId" IS NOT NULL
ON CONFLICT ("productId", "categoryId") DO UPDATE
SET "categoryIndex" = EXCLUDED."categoryIndex";
