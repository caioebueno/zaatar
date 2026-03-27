/*
  Warnings:

  - Added the required column `number` to the `DeliveryAddress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeliveryAddress" ADD COLUMN     "number" TEXT NOT NULL;
