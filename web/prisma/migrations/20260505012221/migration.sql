-- CreateEnum
CREATE TYPE "CustomerFeedbackSentiment" AS ENUM ('NEGATIVE', 'NEUTRAL', 'POSITIVE');

-- CreateEnum
CREATE TYPE "CustomerRewardStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CustomerRewardType" AS ENUM ('FREE_PRODUCT', 'PERCENT_DISCOUNT', 'FIXED_DISCOUNT', 'CUSTOM');

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "language" TEXT,
    "overallRating" INTEGER NOT NULL,
    "sentiment" "CustomerFeedbackSentiment" NOT NULL,
    "productQuality" INTEGER,
    "temperature" INTEGER,
    "deliverySpeed" INTEGER,
    "serviceExperience" INTEGER,
    "comment" TEXT,
    "source" TEXT DEFAULT 'MENU_FEEDBACK',

    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReward" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "CustomerRewardStatus" NOT NULL DEFAULT 'ACTIVE',
    "type" "CustomerRewardType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER DEFAULT 1,
    "value" INTEGER,
    "productId" TEXT,
    "couponCode" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "feedbackId" TEXT,
    "issuedForOrderId" TEXT,
    "redeemedByOrderId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "CustomerReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFeedback_orderId_key" ON "CustomerFeedback"("orderId");

-- CreateIndex
CREATE INDEX "CustomerFeedback_customerId_createdAt_idx" ON "CustomerFeedback"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerFeedback_sentiment_createdAt_idx" ON "CustomerFeedback"("sentiment", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReward_feedbackId_key" ON "CustomerReward"("feedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerReward_redeemedByOrderId_key" ON "CustomerReward"("redeemedByOrderId");

-- CreateIndex
CREATE INDEX "CustomerReward_customerId_status_expiresAt_idx" ON "CustomerReward"("customerId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "CustomerReward_status_expiresAt_idx" ON "CustomerReward"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "CustomerReward_productId_idx" ON "CustomerReward"("productId");

-- CreateIndex
CREATE INDEX "CustomerReward_issuedForOrderId_idx" ON "CustomerReward"("issuedForOrderId");

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReward" ADD CONSTRAINT "CustomerReward_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReward" ADD CONSTRAINT "CustomerReward_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReward" ADD CONSTRAINT "CustomerReward_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "CustomerFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReward" ADD CONSTRAINT "CustomerReward_issuedForOrderId_fkey" FOREIGN KEY ("issuedForOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReward" ADD CONSTRAINT "CustomerReward_redeemedByOrderId_fkey" FOREIGN KEY ("redeemedByOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
