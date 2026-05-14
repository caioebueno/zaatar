-- CreateEnum
CREATE TYPE "ProgressiveDiscountStepType" AS ENUM ('PERCENTAGEDISCOUNT', 'GIFT');

-- CreateTable
CREATE TABLE "ProgressiveDiscount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressiveDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressiveDiscountStep" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "discount" INTEGER,
    "discountType" "ProgressiveDiscountStepType" NOT NULL,
    "progressiveDiscountId" TEXT NOT NULL,

    CONSTRAINT "ProgressiveDiscountStep_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProgressiveDiscountStep" ADD CONSTRAINT "ProgressiveDiscountStep_progressiveDiscountId_fkey" FOREIGN KEY ("progressiveDiscountId") REFERENCES "ProgressiveDiscount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
