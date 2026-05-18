DO $$
BEGIN
  CREATE TYPE "ExternalMenuSyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ExternalMenuEntityType" AS ENUM ('MENU', 'CATEGORY', 'ITEM', 'MODIFIER_GROUP', 'MODIFIER_ITEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ExternalMenuEntityMap" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "provider" "ExternalIntegrationProvider" NOT NULL,
  "userId" TEXT NOT NULL,
  "businessId" TEXT,
  "menuId" TEXT,
  "entityType" "ExternalMenuEntityType" NOT NULL,
  "internalEntityId" TEXT NOT NULL,
  "externalEntityId" TEXT NOT NULL,
  "connectionId" TEXT,
  "rawPayload" JSONB,
  CONSTRAINT "ExternalMenuEntityMap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalMenuEntityMap_provider_userId_entityType_internalEntityId_key"
  ON "ExternalMenuEntityMap"("provider", "userId", "entityType", "internalEntityId");

CREATE INDEX IF NOT EXISTS "ExternalMenuEntityMap_provider_userId_menuId_entityType_idx"
  ON "ExternalMenuEntityMap"("provider", "userId", "menuId", "entityType");

CREATE INDEX IF NOT EXISTS "ExternalMenuEntityMap_connectionId_idx"
  ON "ExternalMenuEntityMap"("connectionId");

CREATE INDEX IF NOT EXISTS "ExternalMenuEntityMap_businessId_idx"
  ON "ExternalMenuEntityMap"("businessId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ExternalMenuEntityMap_connectionId_fkey'
  ) THEN
    ALTER TABLE "ExternalMenuEntityMap"
      ADD CONSTRAINT "ExternalMenuEntityMap_connectionId_fkey"
      FOREIGN KEY ("connectionId") REFERENCES "ExternalIntegrationConnection"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ExternalMenuSyncRun" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "provider" "ExternalIntegrationProvider" NOT NULL,
  "status" "ExternalMenuSyncStatus" NOT NULL,
  "userId" TEXT NOT NULL,
  "businessId" TEXT,
  "menuId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "dryRun" BOOLEAN NOT NULL DEFAULT false,
  "forced" BOOLEAN NOT NULL DEFAULT false,
  "requestHash" TEXT NOT NULL,
  "categoriesCount" INTEGER NOT NULL DEFAULT 0,
  "itemsCount" INTEGER NOT NULL DEFAULT 0,
  "modifierGroupsCount" INTEGER NOT NULL DEFAULT 0,
  "modifierItemsCount" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "connectionId" TEXT,
  CONSTRAINT "ExternalMenuSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ExternalMenuSyncRun_provider_userId_menuId_createdAt_idx"
  ON "ExternalMenuSyncRun"("provider", "userId", "menuId", "createdAt");

CREATE INDEX IF NOT EXISTS "ExternalMenuSyncRun_status_createdAt_idx"
  ON "ExternalMenuSyncRun"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "ExternalMenuSyncRun_connectionId_idx"
  ON "ExternalMenuSyncRun"("connectionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ExternalMenuSyncRun_connectionId_fkey'
  ) THEN
    ALTER TABLE "ExternalMenuSyncRun"
      ADD CONSTRAINT "ExternalMenuSyncRun_connectionId_fkey"
      FOREIGN KEY ("connectionId") REFERENCES "ExternalIntegrationConnection"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
