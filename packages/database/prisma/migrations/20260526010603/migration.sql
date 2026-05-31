-- CreateEnum
CREATE TYPE "UserPushDevicePlatform" AS ENUM ('IOS');

-- CreateTable
CREATE TABLE "UserPushDevice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT,
    "platform" "UserPushDevicePlatform" NOT NULL DEFAULT 'IOS',
    "pushToken" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNotifiedAt" TIMESTAMP(3),
    "notificationFailures" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserPushDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPushDevice_pushToken_key" ON "UserPushDevice"("pushToken");

-- CreateIndex
CREATE INDEX "UserPushDevice_businessId_platform_revokedAt_idx" ON "UserPushDevice"("businessId", "platform", "revokedAt");

-- CreateIndex
CREATE INDEX "UserPushDevice_userId_businessId_platform_idx" ON "UserPushDevice"("userId", "businessId", "platform");

-- AddForeignKey
ALTER TABLE "UserPushDevice" ADD CONSTRAINT "UserPushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPushDevice" ADD CONSTRAINT "UserPushDevice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
