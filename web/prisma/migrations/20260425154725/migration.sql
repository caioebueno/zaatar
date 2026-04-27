-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "externalAddressId" TEXT;

-- CreateTable
CREATE TABLE "ExternalAddress" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "lat" TEXT,
    "lng" TEXT,
    "customerId" TEXT,

    CONSTRAINT "ExternalAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalAddress_customerId_idx" ON "ExternalAddress"("customerId");

-- AddForeignKey
ALTER TABLE "ExternalAddress" ADD CONSTRAINT "ExternalAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_externalAddressId_fkey" FOREIGN KEY ("externalAddressId") REFERENCES "ExternalAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
