CREATE TABLE IF NOT EXISTS "ComboProductItem" (
  "comboId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "sortIndex" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComboProductItem_pkey" PRIMARY KEY ("comboId", "productId")
);

CREATE INDEX IF NOT EXISTS "ComboProductItem_comboId_sortIndex_idx"
  ON "ComboProductItem"("comboId", "sortIndex");

CREATE INDEX IF NOT EXISTS "ComboProductItem_productId_idx"
  ON "ComboProductItem"("productId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ComboProductItem_comboId_fkey'
  ) THEN
    ALTER TABLE "ComboProductItem"
      ADD CONSTRAINT "ComboProductItem_comboId_fkey"
      FOREIGN KEY ("comboId") REFERENCES "Product"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ComboProductItem_productId_fkey'
  ) THEN
    ALTER TABLE "ComboProductItem"
      ADD CONSTRAINT "ComboProductItem_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
