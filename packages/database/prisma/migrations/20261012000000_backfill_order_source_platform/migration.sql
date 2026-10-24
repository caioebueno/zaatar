-- Orders created before `sourcePlatform` existed have no channel recorded.
-- Everything in that period came through our own site, so they are attributed
-- to FOODY; without this they would stack as an untagged bucket in the
-- revenue and order-quantity analytics.
--
-- Scoped to rows that are still NULL, so it is safe to re-run and never
-- overwrites a channel set by the Square webhook (DOORDASH / UBER_EATS /
-- SQUARE) or by manager order creation.
UPDATE "Order"
SET "sourcePlatform" = 'FOODY'
WHERE "sourcePlatform" IS NULL;
