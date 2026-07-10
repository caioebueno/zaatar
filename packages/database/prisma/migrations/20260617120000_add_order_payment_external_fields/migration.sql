ALTER TABLE "OrderPayment"
ADD COLUMN "paymentProvider" "PaymentProvider",
ADD COLUMN "externalId" TEXT;

CREATE INDEX "OrderPayment_paymentProvider_idx" ON "OrderPayment"("paymentProvider");
CREATE INDEX "OrderPayment_externalId_idx" ON "OrderPayment"("externalId");
