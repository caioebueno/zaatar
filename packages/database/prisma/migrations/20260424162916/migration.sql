/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_externalId_key" ON "Order"("externalId");
