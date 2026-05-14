/*
  Warnings:

  - The primary key for the `BusinessOwner` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BusinessOwner" DROP CONSTRAINT "BusinessOwner_pkey",
ADD CONSTRAINT "BusinessOwner_pkey" PRIMARY KEY ("businessId");

-- AlterTable
ALTER TABLE "ExternalIntegrationConnection" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExternalMenuEntityMap" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ExternalMenuSyncRun" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "ExternalMenuEntityMap_provider_userId_entityType_internalEntity" RENAME TO "ExternalMenuEntityMap_provider_userId_entityType_internalEn_key";
