CREATE TYPE "ProductItemType" AS ENUM ('PRODUCT', 'COMBO');

ALTER TABLE "Product"
ADD COLUMN "itemType" "ProductItemType" NOT NULL DEFAULT 'PRODUCT';

CREATE TABLE "ComboItem" (
  "comboId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("comboId", "productId")
);

CREATE INDEX "ComboItem_comboId_createdAt_idx" ON "ComboItem"("comboId", "createdAt");
CREATE INDEX "ComboItem_productId_idx" ON "ComboItem"("productId");

ALTER TABLE "ComboItem"
ADD CONSTRAINT "ComboItem_comboId_fkey"
FOREIGN KEY ("comboId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComboItem"
ADD CONSTRAINT "ComboItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
