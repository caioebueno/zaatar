CREATE TABLE "SquareConnection" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "environment" "ExternalIntegrationEnvironment" NOT NULL DEFAULT 'SANDBOX',
  "userId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "merchantId" TEXT,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "scope" TEXT,
  "tokenType" TEXT,
  "expiresAt" TIMESTAMP(3),
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawPayload" JSONB,

  CONSTRAINT "SquareConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SquareConnection_businessId_key"
  ON "SquareConnection"("businessId");

CREATE UNIQUE INDEX "SquareConnection_merchantId_key"
  ON "SquareConnection"("merchantId");

CREATE INDEX "SquareConnection_userId_environment_idx"
  ON "SquareConnection"("userId", "environment");

CREATE INDEX "SquareConnection_merchantId_idx"
  ON "SquareConnection"("merchantId");

ALTER TABLE "SquareConnection"
  ADD CONSTRAINT "SquareConnection_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SquareConnection"
  ADD CONSTRAINT "SquareConnection_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
