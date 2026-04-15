-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "menuIndex" INTEGER;

-- CreateIndex
CREATE INDEX "Category_menuIndex_idx" ON "Category"("menuIndex");
