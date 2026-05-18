/*
  Warnings:

  - A unique constraint covering the columns `[stripeAccountId]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "State" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "lat" TEXT,
ADD COLUMN     "lng" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "numberComplement" TEXT,
ADD COLUMN     "placeId" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeOnboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeAccountId_key" ON "Business"("stripeAccountId");
