-- DropForeignKey
ALTER TABLE "OrderProducts" DROP CONSTRAINT "OrderProducts_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PreparationStepCategory" DROP CONSTRAINT "PreparationStepCategory_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PreparationStepModifierTrack" DROP CONSTRAINT "PreparationStepModifierTrack_preparationStepTrackId_fkey";

-- DropForeignKey
ALTER TABLE "PreparationStepTrack" DROP CONSTRAINT "PreparationStepTrack_preparationStepCategoryId_fkey";

-- AddForeignKey
ALTER TABLE "PreparationStepCategory" ADD CONSTRAINT "PreparationStepCategory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStepTrack" ADD CONSTRAINT "PreparationStepTrack_preparationStepCategoryId_fkey" FOREIGN KEY ("preparationStepCategoryId") REFERENCES "PreparationStepCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStepModifierTrack" ADD CONSTRAINT "PreparationStepModifierTrack_preparationStepTrackId_fkey" FOREIGN KEY ("preparationStepTrackId") REFERENCES "PreparationStepTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProducts" ADD CONSTRAINT "OrderProducts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
