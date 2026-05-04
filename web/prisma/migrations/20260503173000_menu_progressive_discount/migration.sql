-- AlterTable
ALTER TABLE "Menu" ADD COLUMN "progressiveDiscountId" TEXT;

-- CreateIndex
CREATE INDEX "Menu_progressiveDiscountId_idx" ON "Menu"("progressiveDiscountId");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_progressiveDiscountId_fkey" FOREIGN KEY ("progressiveDiscountId") REFERENCES "ProgressiveDiscount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
