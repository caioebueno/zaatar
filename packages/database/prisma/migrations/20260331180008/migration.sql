/*
  Warnings:

  - You are about to drop the column `productId` on the `PreparationStep` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PreparationStep" DROP CONSTRAINT "PreparationStep_productId_fkey";

-- AlterTable
ALTER TABLE "PreparationStep" DROP COLUMN "productId";

-- CreateTable
CREATE TABLE "_PreparationStepToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PreparationStepToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PreparationStepToProduct_B_index" ON "_PreparationStepToProduct"("B");

-- AddForeignKey
ALTER TABLE "_PreparationStepToProduct" ADD CONSTRAINT "_PreparationStepToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "PreparationStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreparationStepToProduct" ADD CONSTRAINT "_PreparationStepToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
