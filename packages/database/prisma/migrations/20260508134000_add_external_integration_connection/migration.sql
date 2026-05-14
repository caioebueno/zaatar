DO $$
BEGIN
  CREATE TYPE "ExternalIntegrationProvider" AS ENUM ('UBER_EATS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ExternalIntegrationEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ExternalIntegrationConnection" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "provider" "ExternalIntegrationProvider" NOT NULL,
  "environment" "ExternalIntegrationEnvironment" NOT NULL DEFAULT 'SANDBOX',
  "userId" TEXT NOT NULL,
  "businessId" TEXT,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "scope" TEXT,
  "tokenType" TEXT,
  "expiresAt" TIMESTAMP(3),
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawPayload" JSONB,
  CONSTRAINT "ExternalIntegrationConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalIntegrationConnection_provider_userId_key"
  ON "ExternalIntegrationConnection"("provider", "userId");

CREATE INDEX IF NOT EXISTS "ExternalIntegrationConnection_userId_provider_idx"
  ON "ExternalIntegrationConnection"("userId", "provider");

CREATE INDEX IF NOT EXISTS "ExternalIntegrationConnection_businessId_idx"
  ON "ExternalIntegrationConnection"("businessId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExternalIntegrationConnection_userId_fkey'
  ) THEN
    ALTER TABLE "ExternalIntegrationConnection"
      ADD CONSTRAINT "ExternalIntegrationConnection_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ExternalIntegrationConnection_businessId_fkey'
  ) THEN
    ALTER TABLE "ExternalIntegrationConnection"
      ADD CONSTRAINT "ExternalIntegrationConnection_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "Business"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
