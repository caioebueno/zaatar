CREATE TABLE "ComboSlot" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "comboId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "minSelect" INTEGER NOT NULL DEFAULT 1,
  "maxSelect" INTEGER NOT NULL DEFAULT 1,
  "allowDuplicates" BOOLEAN NOT NULL DEFAULT true,
  "sortIndex" INTEGER,

  CONSTRAINT "ComboSlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComboSlotOption" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "slotId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "extraPrice" INTEGER NOT NULL DEFAULT 0,
  "sortIndex" INTEGER,

  CONSTRAINT "ComboSlotOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ComboSlot_comboId_sortIndex_idx" ON "ComboSlot"("comboId", "sortIndex");
CREATE INDEX "ComboSlotOption_slotId_sortIndex_idx" ON "ComboSlotOption"("slotId", "sortIndex");
CREATE INDEX "ComboSlotOption_productId_idx" ON "ComboSlotOption"("productId");
CREATE UNIQUE INDEX "ComboSlotOption_slotId_productId_key" ON "ComboSlotOption"("slotId", "productId");

ALTER TABLE "ComboSlot"
ADD CONSTRAINT "ComboSlot_comboId_fkey"
FOREIGN KEY ("comboId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComboSlotOption"
ADD CONSTRAINT "ComboSlotOption_slotId_fkey"
FOREIGN KEY ("slotId") REFERENCES "ComboSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComboSlotOption"
ADD CONSTRAINT "ComboSlotOption_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

WITH ranked AS (
  SELECT
    "comboId",
    "productId",
    "quantity",
    "createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY "comboId"
      ORDER BY "createdAt" ASC, "productId" ASC
    ) AS slot_order
  FROM "ComboItem"
)
INSERT INTO "ComboSlot" (
  "id",
  "createdAt",
  "updatedAt",
  "comboId",
  "name",
  "minSelect",
  "maxSelect",
  "allowDuplicates",
  "sortIndex"
)
SELECT
  CONCAT("comboId", '::slot::', slot_order),
  "createdAt",
  CURRENT_TIMESTAMP,
  "comboId",
  CONCAT('Item ', slot_order),
  "quantity",
  "quantity",
  false,
  slot_order
FROM ranked;

WITH ranked AS (
  SELECT
    "comboId",
    "productId",
    ROW_NUMBER() OVER (
      PARTITION BY "comboId"
      ORDER BY "createdAt" ASC, "productId" ASC
    ) AS slot_order
  FROM "ComboItem"
)
INSERT INTO "ComboSlotOption" (
  "id",
  "createdAt",
  "slotId",
  "productId",
  "extraPrice",
  "sortIndex"
)
SELECT
  CONCAT("comboId", '::slot::', slot_order, '::option::', "productId"),
  CURRENT_TIMESTAMP,
  CONCAT("comboId", '::slot::', slot_order),
  "productId",
  0,
  1
FROM ranked;

DROP TABLE "ComboItem";
