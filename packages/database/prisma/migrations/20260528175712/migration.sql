-- CreateTable
CREATE TABLE "OrderIntent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'ACCEPTED',
    "type" "OrderType" NOT NULL DEFAULT 'DELIVERY',
    "paymentMethod" "PaymentType" NOT NULL DEFAULT 'CARD',
    "paymentProvider" "PaymentProvider",
    "tipAmount" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "progressiveDiscountSnapshot" JSONB,
    "amount" INTEGER,
    "customerId" TEXT,
    "deliveryAddressId" TEXT,

    CONSTRAINT "OrderIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderIntentProduct" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderIntentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "comments" TEXT,
    "fullAmount" INTEGER,
    "amount" INTEGER,

    CONSTRAINT "OrderIntentProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ModifierGroupItemToOrderIntentProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModifierGroupItemToOrderIntentProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "OrderIntent_customerId_createdAt_idx" ON "OrderIntent"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderIntent_deliveryAddressId_createdAt_idx" ON "OrderIntent"("deliveryAddressId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderIntentProduct_orderIntentId_createdAt_idx" ON "OrderIntentProduct"("orderIntentId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderIntentProduct_productId_idx" ON "OrderIntentProduct"("productId");

-- CreateIndex
CREATE INDEX "_ModifierGroupItemToOrderIntentProduct_B_index" ON "_ModifierGroupItemToOrderIntentProduct"("B");

-- AddForeignKey
ALTER TABLE "OrderIntent" ADD CONSTRAINT "OrderIntent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIntent" ADD CONSTRAINT "OrderIntent_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "DeliveryAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIntentProduct" ADD CONSTRAINT "OrderIntentProduct_orderIntentId_fkey" FOREIGN KEY ("orderIntentId") REFERENCES "OrderIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIntentProduct" ADD CONSTRAINT "OrderIntentProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModifierGroupItemToOrderIntentProduct" ADD CONSTRAINT "_ModifierGroupItemToOrderIntentProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ModifierGroupItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModifierGroupItemToOrderIntentProduct" ADD CONSTRAINT "_ModifierGroupItemToOrderIntentProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderIntentProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
