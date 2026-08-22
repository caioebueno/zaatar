ALTER TABLE "Menu"
ADD COLUMN "squareMenuId" TEXT,
ADD COLUMN "squareMenuVersion" TEXT;

CREATE UNIQUE INDEX "Menu_squareMenuId_key" ON "Menu"("squareMenuId");

ALTER TABLE "MenuCategory"
ADD COLUMN "squareMenuCategoryId" TEXT,
ADD COLUMN "squareMenuCategoryVersion" TEXT;

CREATE UNIQUE INDEX "MenuCategory_squareMenuCategoryId_key" ON "MenuCategory"("squareMenuCategoryId");
