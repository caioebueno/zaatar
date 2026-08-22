/*
  Warnings:

  - You are about to drop the `BusinessOwner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BusinessOwner" DROP CONSTRAINT "BusinessOwner_businessId_fkey";

-- DropForeignKey
ALTER TABLE "BusinessOwner" DROP CONSTRAINT "BusinessOwner_userId_fkey";

-- AlterTable
ALTER TABLE "BusinessMember" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "BusinessOwner";
