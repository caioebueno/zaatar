DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentProvider') THEN
    CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');
  END IF;
END
$$;

ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "paymentProvider" "PaymentProvider";
