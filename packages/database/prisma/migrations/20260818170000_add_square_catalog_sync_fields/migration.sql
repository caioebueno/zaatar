ALTER TABLE "ModifierGroup"
ADD COLUMN "squareModifierListId" TEXT,
ADD COLUMN "squareModifierListVersion" TEXT;

ALTER TABLE "ModifierGroupItem"
ADD COLUMN "squareModifierId" TEXT,
ADD COLUMN "squareModifierVersion" TEXT;

ALTER TABLE "Product"
ADD COLUMN "squareItemId" TEXT,
ADD COLUMN "squareItemVersion" TEXT,
ADD COLUMN "squareVariationId" TEXT,
ADD COLUMN "squareVariationVersion" TEXT;

ALTER TABLE "MenuCategory"
ADD COLUMN "squareCategoryId" TEXT,
ADD COLUMN "squareCategoryVersion" TEXT;

CREATE UNIQUE INDEX "ModifierGroup_squareModifierListId_key"
ON "ModifierGroup"("squareModifierListId");

CREATE UNIQUE INDEX "ModifierGroupItem_squareModifierId_key"
ON "ModifierGroupItem"("squareModifierId");

CREATE UNIQUE INDEX "Product_squareItemId_key"
ON "Product"("squareItemId");

CREATE UNIQUE INDEX "Product_squareVariationId_key"
ON "Product"("squareVariationId");

CREATE UNIQUE INDEX "MenuCategory_squareCategoryId_key"
ON "MenuCategory"("squareCategoryId");
