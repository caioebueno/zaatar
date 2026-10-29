ALTER TABLE "Menu" ADD COLUMN "progressiveDiscountId" TEXT;

CREATE INDEX "Menu_progressiveDiscountId_idx" ON "Menu"("progressiveDiscountId");

ALTER TABLE "Menu"
  ADD CONSTRAINT "Menu_progressiveDiscountId_fkey"
  FOREIGN KEY ("progressiveDiscountId") REFERENCES "ProgressiveDiscount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Until now every menu served the newest open ladder. Attach that ladder to
-- every existing menu so the storefront looks the same after deploy.
UPDATE "Menu"
SET "progressiveDiscountId" = (
  SELECT "id" FROM "ProgressiveDiscount"
  WHERE "completed" = false
  ORDER BY "createdAt" DESC
  LIMIT 1
);
