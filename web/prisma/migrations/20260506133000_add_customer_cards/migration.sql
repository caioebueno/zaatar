-- AlterTable
ALTER TABLE "Customer"
ADD COLUMN "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "CustomerCard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "stripePaymentMethodId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "expMonth" INTEGER NOT NULL,
    "expYear" INTEGER NOT NULL,
    "funding" TEXT,
    "country" TEXT,
    "fingerprint" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CustomerCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_stripeCustomerId_idx" ON "Customer"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCard_stripePaymentMethodId_key" ON "CustomerCard"("stripePaymentMethodId");

-- CreateIndex
CREATE INDEX "CustomerCard_customerId_isDefault_idx" ON "CustomerCard"("customerId", "isDefault");

-- CreateIndex
CREATE INDEX "CustomerCard_customerId_createdAt_idx" ON "CustomerCard"("customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "CustomerCard" ADD CONSTRAINT "CustomerCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
