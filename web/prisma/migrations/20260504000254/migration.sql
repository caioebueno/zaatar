/*
  Warnings:

  - You are about to drop the column `progressiveDiscountId` on the `Menu` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_progressiveDiscountId_fkey";

-- DropIndex
DROP INDEX "Menu_progressiveDiscountId_idx";

-- AlterTable
ALTER TABLE "Menu" DROP COLUMN "progressiveDiscountId";
