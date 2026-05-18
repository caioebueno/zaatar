-- CreateEnum
CREATE TYPE "InventoryPlaceType" AS ENUM ('FRIDGE', 'FREEZER', 'SHELF', 'PANTRY', 'OTHER');

-- CreateEnum
CREATE TYPE "InventoryChecklistStatus" AS ENUM ('OPEN', 'SUBMITTED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "InventoryChecklistItemResult" AS ENUM ('PENDING', 'OK', 'BELOW_MIN', 'REFILL_NEEDED', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "InventoryAlertType" AS ENUM ('LOW_STOCK', 'THRESHOLD', 'REFILL');

-- CreateEnum
CREATE TYPE "InventoryAlertSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "InventoryAlertStatus" AS ENUM ('OPEN', 'ACKED', 'RESOLVED');

-- CreateTable
CREATE TABLE "InventoryPlace" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InventoryPlaceType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER,
    "notes" TEXT,

    CONSTRAINT "InventoryPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryProduct" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "alertThreshold" INTEGER,
    "requiresRefill" BOOLEAN NOT NULL DEFAULT false,
    "notifyBelowThreshold" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "InventoryProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryStock" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "placeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMP(3),
    "lastCheckedBy" TEXT,

    CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryChecklist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checkDate" DATE NOT NULL,
    "status" "InventoryChecklistStatus" NOT NULL DEFAULT 'OPEN',
    "startedBy" TEXT,
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryChecklistItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checklistId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedMinQuantity" INTEGER NOT NULL DEFAULT 0,
    "countedQuantity" INTEGER,
    "result" "InventoryChecklistItemResult" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3),
    "checkedBy" TEXT,

    CONSTRAINT "InventoryChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryAlert" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "InventoryAlertType" NOT NULL,
    "severity" "InventoryAlertSeverity" NOT NULL,
    "status" "InventoryAlertStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "checklistId" TEXT,
    "checklistItemId" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ackedAt" TIMESTAMP(3),
    "ackedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "InventoryAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryStockEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "beforeQuantity" INTEGER,
    "afterQuantity" INTEGER,
    "actorId" TEXT,
    "source" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "InventoryStockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStock_placeId_productId_key" ON "InventoryStock"("placeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryChecklist_checkDate_key" ON "InventoryChecklist"("checkDate");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryChecklistItem_checklistId_productId_placeId_key" ON "InventoryChecklistItem"("checklistId", "productId", "placeId");

-- CreateIndex
CREATE INDEX "InventoryAlert_status_type_idx" ON "InventoryAlert"("status", "type");

-- CreateIndex
CREATE INDEX "InventoryStockEvent_placeId_productId_createdAt_idx" ON "InventoryStockEvent"("placeId", "productId", "createdAt");

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryChecklistItem" ADD CONSTRAINT "InventoryChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "InventoryChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryChecklistItem" ADD CONSTRAINT "InventoryChecklistItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryChecklistItem" ADD CONSTRAINT "InventoryChecklistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAlert" ADD CONSTRAINT "InventoryAlert_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAlert" ADD CONSTRAINT "InventoryAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAlert" ADD CONSTRAINT "InventoryAlert_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "InventoryChecklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryAlert" ADD CONSTRAINT "InventoryAlert_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "InventoryChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStockEvent" ADD CONSTRAINT "InventoryStockEvent_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStockEvent" ADD CONSTRAINT "InventoryStockEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
