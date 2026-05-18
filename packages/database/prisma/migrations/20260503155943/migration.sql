-- CreateEnum
CREATE TYPE "ExclusivePromotionWeekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "ComboSlot" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InventoryAlert" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InventoryChecklist" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InventoryChecklistItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InventoryPlace" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InventoryProduct" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InventoryStock" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Menu" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ExclusivePromotion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expireAt" TIMESTAMP(3),
    "validWeekdays" "ExclusivePromotionWeekday"[] DEFAULT ARRAY[]::"ExclusivePromotionWeekday"[],

    CONSTRAINT "ExclusivePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExclusivePromotionProduct" (
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExclusivePromotionProduct_pkey" PRIMARY KEY ("promotionId","productId")
);

-- CreateIndex
CREATE INDEX "ExclusivePromotionProduct_productId_idx" ON "ExclusivePromotionProduct"("productId");

-- AddForeignKey
ALTER TABLE "ExclusivePromotionProduct" ADD CONSTRAINT "ExclusivePromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "ExclusivePromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExclusivePromotionProduct" ADD CONSTRAINT "ExclusivePromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
