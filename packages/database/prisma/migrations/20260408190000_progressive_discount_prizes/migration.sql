CREATE TABLE "ProgressiveDiscountPrize" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "progressiveDiscountId" TEXT NOT NULL,

    CONSTRAINT "ProgressiveDiscountPrize_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressiveDiscountPrizeProduct" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prizeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProgressiveDiscountPrizeProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgressiveDiscountPrizeProduct_prizeId_productId_key" ON "ProgressiveDiscountPrizeProduct"("prizeId", "productId");
CREATE INDEX "ProgressiveDiscountPrize_progressiveDiscountId_idx" ON "ProgressiveDiscountPrize"("progressiveDiscountId");
CREATE INDEX "ProgressiveDiscountPrizeProduct_productId_idx" ON "ProgressiveDiscountPrizeProduct"("productId");

ALTER TABLE "ProgressiveDiscountPrize" ADD CONSTRAINT "ProgressiveDiscountPrize_progressiveDiscountId_fkey" FOREIGN KEY ("progressiveDiscountId") REFERENCES "ProgressiveDiscount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressiveDiscountPrizeProduct" ADD CONSTRAINT "ProgressiveDiscountPrizeProduct_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "ProgressiveDiscountPrize"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressiveDiscountPrizeProduct" ADD CONSTRAINT "ProgressiveDiscountPrizeProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
