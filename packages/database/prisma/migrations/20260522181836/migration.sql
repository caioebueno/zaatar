-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DispatchRouteMilestoneType" ADD VALUE 'LEFT_DROPOFF';
ALTER TYPE "DispatchRouteMilestoneType" ADD VALUE 'ARRIVED_RESTAURANT';

-- AlterTable
ALTER TABLE "Dispatch" ADD COLUMN     "arrivedAtRestaurantAt" TIMESTAMP(3),
ADD COLUMN     "arrivedAtRestaurantLat" DOUBLE PRECISION,
ADD COLUMN     "arrivedAtRestaurantLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "leftAtDropOffAt" TIMESTAMP(3),
ADD COLUMN     "leftAtDropOffLat" DOUBLE PRECISION,
ADD COLUMN     "leftAtDropOffLng" DOUBLE PRECISION;
