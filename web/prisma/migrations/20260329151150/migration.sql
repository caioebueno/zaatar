/*
  Warnings:

  - You are about to drop the column `productId` on the `ModifierGroup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ModifierGroup" DROP CONSTRAINT "ModifierGroup_productId_fkey";

-- AlterTable
ALTER TABLE "ModifierGroup" DROP COLUMN "productId";

-- CreateTable
CREATE TABLE "_ModifierGroupToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModifierGroupToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ModifierGroupToProduct_B_index" ON "_ModifierGroupToProduct"("B");

-- AddForeignKey
ALTER TABLE "_ModifierGroupToProduct" ADD CONSTRAINT "_ModifierGroupToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ModifierGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModifierGroupToProduct" ADD CONSTRAINT "_ModifierGroupToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
