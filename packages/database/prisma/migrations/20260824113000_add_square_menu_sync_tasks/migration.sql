ALTER TYPE "SquareCatalogSyncTaskType"
ADD VALUE IF NOT EXISTS 'MENU_UPDATE';

ALTER TABLE "SquareCatalogSyncTask"
ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "SquareCatalogSyncTask"
ADD COLUMN "menuId" TEXT;

ALTER TABLE "SquareCatalogSyncTask"
ADD CONSTRAINT "SquareCatalogSyncTask_menuId_fkey"
FOREIGN KEY ("menuId") REFERENCES "Menu"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE INDEX "SquareCatalogSyncTask_businessId_menuId_createdAt_idx"
ON "SquareCatalogSyncTask"("businessId", "menuId", "createdAt");

CREATE INDEX "SquareCatalogSyncTask_menuId_createdAt_idx"
ON "SquareCatalogSyncTask"("menuId", "createdAt");
