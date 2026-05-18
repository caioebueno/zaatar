DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'InventoryChecklistItem_checklist_product_place_key'
  )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'InventoryChecklistItem_checklistId_productId_placeId_key'
    ) THEN
    ALTER INDEX "InventoryChecklistItem_checklist_product_place_key"
      RENAME TO "InventoryChecklistItem_checklistId_productId_placeId_key";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'InventoryStockEvent_place_product_createdAt_idx'
  )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = 'InventoryStockEvent_placeId_productId_createdAt_idx'
    ) THEN
    ALTER INDEX "InventoryStockEvent_place_product_createdAt_idx"
      RENAME TO "InventoryStockEvent_placeId_productId_createdAt_idx";
  END IF;
END $$;
