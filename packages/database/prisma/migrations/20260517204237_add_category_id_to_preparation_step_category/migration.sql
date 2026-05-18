-- AlterTable
ALTER TABLE "PreparationStepCategory" ADD COLUMN     "categoryId" TEXT;

-- AddForeignKey
ALTER TABLE "PreparationStepCategory" ADD CONSTRAINT "PreparationStepCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
