-- CreateTable
CREATE TABLE "MenuVisit" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "visitorId" TEXT NOT NULL,
  "visitKey" TEXT NOT NULL,
  "menuId" TEXT,
  "promotionId" TEXT,
  "language" TEXT,
  "pathname" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,

  CONSTRAINT "MenuVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuVisit_visitorId_visitKey_key" ON "MenuVisit"("visitorId", "visitKey");

-- CreateIndex
CREATE INDEX "MenuVisit_createdAt_idx" ON "MenuVisit"("createdAt");

-- CreateIndex
CREATE INDEX "MenuVisit_menuId_createdAt_idx" ON "MenuVisit"("menuId", "createdAt");

-- CreateIndex
CREATE INDEX "MenuVisit_promotionId_createdAt_idx" ON "MenuVisit"("promotionId", "createdAt");

-- AddForeignKey
ALTER TABLE "MenuVisit" ADD CONSTRAINT "MenuVisit_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuVisit" ADD CONSTRAINT "MenuVisit_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "ExclusivePromotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
