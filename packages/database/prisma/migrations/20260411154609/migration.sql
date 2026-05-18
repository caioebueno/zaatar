-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "categoryIndex" INTEGER;

-- CreateIndex
CREATE INDEX "Product_categoryId_categoryIndex_idx" ON "Product"("categoryId", "categoryIndex");
