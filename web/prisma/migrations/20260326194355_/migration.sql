-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentType" NOT NULL DEFAULT 'CARD',
ADD COLUMN     "tipAmount" INTEGER;
