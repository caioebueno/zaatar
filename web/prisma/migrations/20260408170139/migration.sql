/*
  Defensive migration:
  - In this repo history, this migration can run before the migration that creates
    "ProgressiveDiscountPrize" when replaying to a shadow database.
  - We guard every change so shadow replays succeed.
*/

DO $$
BEGIN
  -- Nothing to do if the table does not exist yet.
  IF to_regclass('"ProgressiveDiscountPrize"') IS NULL THEN
    RETURN;
  END IF;

  -- Old schema path: table had "progressiveDiscountId".
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ProgressiveDiscountPrize'
      AND column_name = 'progressiveDiscountId'
  ) THEN
    ALTER TABLE "ProgressiveDiscountPrize"
      DROP CONSTRAINT IF EXISTS "ProgressiveDiscountPrize_progressiveDiscountId_fkey";

    ALTER TABLE "ProgressiveDiscountPrize"
      ADD COLUMN IF NOT EXISTS "progressiveDiscountStepId" TEXT;

    -- Best-effort backfill: attach each prize to the first step of its discount.
    UPDATE "ProgressiveDiscountPrize" prize
    SET "progressiveDiscountStepId" = (
      SELECT step."id"
      FROM "ProgressiveDiscountStep" step
      WHERE step."progressiveDiscountId" = prize."progressiveDiscountId"
      ORDER BY step."amount" ASC, step."createdAt" ASC, step."id" ASC
      LIMIT 1
    )
    WHERE prize."progressiveDiscountStepId" IS NULL;

    ALTER TABLE "ProgressiveDiscountPrize"
      DROP COLUMN IF EXISTS "progressiveDiscountId";
  END IF;

  -- Ensure FK exists when the new column exists.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ProgressiveDiscountPrize'
      AND column_name = 'progressiveDiscountStepId'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProgressiveDiscountPrize_progressiveDiscountStepId_fkey'
  ) THEN
    ALTER TABLE "ProgressiveDiscountPrize"
      ADD CONSTRAINT "ProgressiveDiscountPrize_progressiveDiscountStepId_fkey"
      FOREIGN KEY ("progressiveDiscountStepId")
      REFERENCES "ProgressiveDiscountStep"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
