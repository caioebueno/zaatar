CREATE TYPE "SquareCatalogSyncTaskStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
  'SKIPPED'
);

CREATE TYPE "SquareCatalogSyncTaskType" AS ENUM (
  'PRODUCT_UPDATE'
);

CREATE TABLE "SquareCatalogSyncTask" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "businessId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "taskType" "SquareCatalogSyncTaskType" NOT NULL DEFAULT 'PRODUCT_UPDATE',
  "status" "SquareCatalogSyncTaskStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,

  CONSTRAINT "SquareCatalogSyncTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SquareCatalogSyncTask_businessId_productId_createdAt_idx"
ON "SquareCatalogSyncTask"("businessId", "productId", "createdAt");

CREATE INDEX "SquareCatalogSyncTask_status_availableAt_createdAt_idx"
ON "SquareCatalogSyncTask"("status", "availableAt", "createdAt");

CREATE INDEX "SquareCatalogSyncTask_productId_createdAt_idx"
ON "SquareCatalogSyncTask"("productId", "createdAt");

ALTER TABLE "SquareCatalogSyncTask"
ADD CONSTRAINT "SquareCatalogSyncTask_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SquareCatalogSyncTask"
ADD CONSTRAINT "SquareCatalogSyncTask_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
