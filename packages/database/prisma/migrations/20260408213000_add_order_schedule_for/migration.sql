-- Add scheduleFor without touching existing data
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "scheduleFor" TIMESTAMP(3);
