-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentType" "PaymentType" NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderPayment_orderId_idx" ON "OrderPayment"("orderId");

-- CreateIndex
CREATE INDEX "OrderPayment_paymentType_idx" ON "OrderPayment"("paymentType");

-- CreateIndex
CREATE INDEX "OrderPayment_paidAt_idx" ON "OrderPayment"("paidAt");

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
