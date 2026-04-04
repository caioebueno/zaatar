-- AlterTable
ALTER TABLE "ProgressiveDiscount" ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationStep" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,

    CONSTRAINT "PreparationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationStepCategory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "PreparationStepCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparationStepTrack" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "preparationStepId" TEXT NOT NULL,
    "preparationStepCategoryId" TEXT NOT NULL,

    CONSTRAINT "PreparationStepTrack_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PreparationStep" ADD CONSTRAINT "PreparationStep_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStep" ADD CONSTRAINT "PreparationStep_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStepCategory" ADD CONSTRAINT "PreparationStepCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStepCategory" ADD CONSTRAINT "PreparationStepCategory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStepTrack" ADD CONSTRAINT "PreparationStepTrack_preparationStepId_fkey" FOREIGN KEY ("preparationStepId") REFERENCES "PreparationStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparationStepTrack" ADD CONSTRAINT "PreparationStepTrack_preparationStepCategoryId_fkey" FOREIGN KEY ("preparationStepCategoryId") REFERENCES "PreparationStepCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
