/*
  Warnings:

  - You are about to drop the column `categoryId` on the `PreparationStepCategory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PreparationStepCategory" DROP CONSTRAINT "PreparationStepCategory_categoryId_fkey";

-- AlterTable
ALTER TABLE "PreparationStepCategory" DROP COLUMN "categoryId";
