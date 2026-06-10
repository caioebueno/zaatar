-- AlterTable
ALTER TABLE "Dispatch" ADD COLUMN     "leftRestaurantAt" TIMESTAMP(3),
ADD COLUMN     "leftRestaurantLat" DOUBLE PRECISION,
ADD COLUMN     "leftRestaurantLng" DOUBLE PRECISION;
