/*
  Reconcile ProgressiveDiscountPrize relation target:
  - Old shape: ProgressiveDiscountPrize.progressiveDiscountId -> ProgressiveDiscount
  - New shape: ProgressiveDiscountPrize.progressiveDiscountStepId -> ProgressiveDiscountStep
*/

DO $$
BEGIN
  IF to_regclass('"ProgressiveDiscountPrize"') IS NULL THEN
    RETURN;
  END IF;

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

    -- Ensure each discount referenced by prizes has at least one step.
    INSERT INTO "ProgressiveDiscountStep" (
      "id",
      "amount",
      "discountType",
      "progressiveDiscountId"
    )
    SELECT
      'auto-step-' || prize."progressiveDiscountId",
      0,
      'GIFT',
      prize."progressiveDiscountId"
    FROM "ProgressiveDiscountPrize" prize
    LEFT JOIN "ProgressiveDiscountStep" step
      ON step."progressiveDiscountId" = prize."progressiveDiscountId"
    WHERE step."id" IS NULL
    GROUP BY prize."progressiveDiscountId"
    ON CONFLICT ("id") DO NOTHING;

    -- Backfill step link using the lowest amount step for that discount.
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

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ProgressiveDiscountPrize'
      AND column_name = 'progressiveDiscountStepId'
  ) THEN
    IF NOT EXISTS (
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

    IF NOT EXISTS (
      SELECT 1
      FROM "ProgressiveDiscountPrize"
      WHERE "progressiveDiscountStepId" IS NULL
    ) THEN
      ALTER TABLE "ProgressiveDiscountPrize"
        ALTER COLUMN "progressiveDiscountStepId" SET NOT NULL;
    END IF;
  END IF;
END $$;
