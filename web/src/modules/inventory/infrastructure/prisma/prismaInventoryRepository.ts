import { randomUUID } from "crypto";
import prisma from "@/prisma";
import { InventoryError } from "../../domain/inventory.errors";
import type { InventoryRepository } from "../../domain/inventory.repository";
import type {
  AckInventoryAlertInput,
  CreateInventoryPlaceInput,
  CreateInventoryProductInput,
  DeleteInventoryStockInput,
  InventoryAlert,
  InventoryAlertSeverity,
  InventoryAlertStatus,
  InventoryAlertType,
  InventoryChecklist,
  InventoryChecklistItem,
  InventoryChecklistItemResult,
  InventoryChecklistWithItems,
  InventoryDashboard,
  InventoryPlace,
  InventoryPlaceType,
  InventoryProduct,
  InventoryStock,
  ListInventoryAlertsInput,
  OpenDailyInventoryChecklistInput,
  ResolveInventoryAlertInput,
  SubmitInventoryChecklistInput,
  TransferInventoryStockInput,
  TransferInventoryStockResult,
  UpdateInventoryStockChecklistPromptInput,
  UpdateInventoryChecklistItemInput,
  UpdateInventoryPlaceInput,
  UpdateInventoryProductInput,
  UpsertInventoryStockInput,
} from "../../domain/inventory.types";

type QueryExecutor = {
  $queryRaw: typeof prisma.$queryRaw;
  $executeRaw: typeof prisma.$executeRaw;
};

type SchemaExecutor = QueryExecutor & {
  $executeRawUnsafe: typeof prisma.$executeRawUnsafe;
};

type PlaceRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  type: string;
  active: boolean;
  displayOrder: number | null;
  notes: string | null;
};

type ProductRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  unit: string;
  active: boolean;
  minQuantity: number;
  alertThreshold: number | null;
  requiresRefill: boolean;
  notifyBelowThreshold: boolean;
  notes: string | null;
};

type StockRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  currentQuantity: number;
  minQuantity: number;
  includeInChecklist: boolean;
  lastCheckedAt: Date | null;
  lastCheckedBy: string | null;
};

type ChecklistRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  checkDate: Date;
  status: string;
  startedBy: string | null;
  submittedBy: string | null;
  submittedAt: Date | null;
};

type ChecklistItemRow = {
  id: string;
  checklistId: string;
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  expectedMinQuantity: number;
  countedQuantity: number | null;
  outOfStock: boolean;
  result: string;
  notes: string | null;
  checkedAt: Date | null;
  checkedBy: string | null;
};

type AlertRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: string;
  severity: string;
  status: string;
  message: string;
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  checklistId: string | null;
  checklistItemId: string | null;
  triggeredAt: Date;
  ackedAt: Date | null;
  ackedBy: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
};

type AlertEvaluationRow = {
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  expectedMinQuantity: number;
  alertThreshold: number | null;
  requiresRefill: boolean;
  notifyBelowThreshold: boolean;
  countedQuantity: number;
  checklistItemId: string;
};

let schemaReadyPromise: Promise<void> | null = null;

function toInventoryPlaceType(value: string): InventoryPlaceType {
  if (
    value === "FRIDGE" ||
    value === "FREEZER" ||
    value === "SHELF" ||
    value === "PANTRY" ||
    value === "OTHER"
  ) {
    return value;
  }

  return "OTHER";
}

function toChecklistStatus(value: string): InventoryChecklist["status"] {
  if (value === "OPEN" || value === "SUBMITTED" || value === "REVIEWED") {
    return value;
  }

  return "OPEN";
}

function toChecklistItemResult(value: string): InventoryChecklistItemResult {
  if (
    value === "PENDING" ||
    value === "OK" ||
    value === "BELOW_MIN" ||
    value === "REFILL_NEEDED" ||
    value === "OUT_OF_STOCK"
  ) {
    return value;
  }

  return "PENDING";
}

function toAlertType(value: string): InventoryAlertType {
  if (value === "LOW_STOCK" || value === "THRESHOLD" || value === "REFILL") {
    return value;
  }

  return "LOW_STOCK";
}

function toAlertSeverity(value: string): InventoryAlertSeverity {
  if (value === "CRITICAL" || value === "HIGH" || value === "MEDIUM" || value === "LOW") {
    return value;
  }

  return "LOW";
}

function toAlertStatus(value: string): InventoryAlertStatus {
  if (value === "OPEN" || value === "ACKED" || value === "RESOLVED") {
    return value;
  }

  return "OPEN";
}

function toFloridaDate(value?: string | null): string {
  if (value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new InventoryError("INVALID_PARAMS", { field: "date" });
    }

    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

function mapPlace(row: PlaceRow): InventoryPlace {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    name: row.name,
    type: toInventoryPlaceType(row.type),
    active: row.active,
    displayOrder: row.displayOrder,
    notes: row.notes,
  };
}

function mapProduct(row: ProductRow): InventoryProduct {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    name: row.name,
    unit: row.unit,
    active: row.active,
    minQuantity: row.minQuantity,
    alertThreshold: row.alertThreshold,
    requiresRefill: row.requiresRefill,
    notifyBelowThreshold: row.notifyBelowThreshold,
    notes: row.notes,
  };
}

function mapStock(row: StockRow): InventoryStock {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    placeId: row.placeId,
    productId: row.productId,
    placeName: row.placeName,
    productName: row.productName,
    currentQuantity: row.currentQuantity,
    minQuantity: row.minQuantity,
    includeInChecklist: row.includeInChecklist,
    lastCheckedAt: row.lastCheckedAt ? row.lastCheckedAt.toISOString() : null,
    lastCheckedBy: row.lastCheckedBy,
  };
}

async function getStockRowByPlaceAndProduct(
  executor: QueryExecutor,
  placeId: string,
  productId: string,
): Promise<StockRow | null> {
  const [row] = await executor.$queryRaw<StockRow[]>`
    SELECT
      s."id",
      s."createdAt",
      s."updatedAt",
      s."placeId",
      s."productId",
      p."name" as "placeName",
      pr."name" as "productName",
      s."currentQuantity",
      s."minQuantity",
      s."includeInChecklist",
      s."lastCheckedAt",
      s."lastCheckedBy"
    FROM "InventoryStock" s
    INNER JOIN "InventoryPlace" p ON p."id" = s."placeId"
    INNER JOIN "InventoryProduct" pr ON pr."id" = s."productId"
    WHERE s."placeId" = ${placeId} AND s."productId" = ${productId}
    LIMIT 1
  `;

  return row ?? null;
}

function mapChecklist(row: ChecklistRow): InventoryChecklist {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    checkDate: row.checkDate.toISOString().slice(0, 10),
    status: toChecklistStatus(row.status),
    startedBy: row.startedBy,
    submittedBy: row.submittedBy,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
  };
}

function mapChecklistItem(row: ChecklistItemRow): InventoryChecklistItem {
  return {
    id: row.id,
    checklistId: row.checklistId,
    placeId: row.placeId,
    productId: row.productId,
    placeName: row.placeName,
    productName: row.productName,
    expectedMinQuantity: row.expectedMinQuantity,
    countedQuantity: row.countedQuantity,
    outOfStock: row.outOfStock,
    result: toChecklistItemResult(row.result),
    notes: row.notes,
    checkedAt: row.checkedAt ? row.checkedAt.toISOString() : null,
    checkedBy: row.checkedBy,
  };
}

function mapAlert(row: AlertRow): InventoryAlert {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    type: toAlertType(row.type),
    severity: toAlertSeverity(row.severity),
    status: toAlertStatus(row.status),
    message: row.message,
    placeId: row.placeId,
    productId: row.productId,
    placeName: row.placeName,
    productName: row.productName,
    checklistId: row.checklistId,
    checklistItemId: row.checklistItemId,
    triggeredAt: row.triggeredAt.toISOString(),
    ackedAt: row.ackedAt ? row.ackedAt.toISOString() : null,
    ackedBy: row.ackedBy,
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    resolvedBy: row.resolvedBy,
  };
}

function deriveChecklistResult(
  countedQuantity: number,
  minQuantity: number,
  requiresRefill: boolean,
): InventoryChecklistItemResult {
  if (countedQuantity === 0) {
    return "OUT_OF_STOCK";
  }

  if (countedQuantity < minQuantity) {
    return requiresRefill ? "REFILL_NEEDED" : "BELOW_MIN";
  }

  return "OK";
}

function buildAlertMessage(
  type: InventoryAlertType,
  row: AlertEvaluationRow,
): string {
  if (type === "LOW_STOCK") {
    return `${row.productName} is below minimum at ${row.placeName} (${row.countedQuantity}/${row.expectedMinQuantity})`;
  }

  if (type === "THRESHOLD") {
    return `${row.productName} reached notification threshold at ${row.placeName} (${row.countedQuantity}/${row.alertThreshold})`;
  }

  return `${row.productName} requires refill at ${row.placeName} (${row.countedQuantity}/${row.expectedMinQuantity})`;
}

async function ensureInventorySchema(executor: SchemaExecutor) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await executor.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InventoryPlace" (
          "id" text PRIMARY KEY,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now(),
          "name" text NOT NULL,
          "type" text NOT NULL,
          "active" boolean NOT NULL DEFAULT true,
          "displayOrder" integer,
          "notes" text
        )
      `);

      await executor.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InventoryProduct" (
          "id" text PRIMARY KEY,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now(),
          "name" text NOT NULL,
          "unit" text NOT NULL,
          "active" boolean NOT NULL DEFAULT true,
          "minQuantity" integer NOT NULL DEFAULT 0,
          "alertThreshold" integer,
          "requiresRefill" boolean NOT NULL DEFAULT false,
          "notifyBelowThreshold" boolean NOT NULL DEFAULT false,
          "notes" text
        )
      `);

      await executor.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InventoryStock" (
          "id" text PRIMARY KEY,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now(),
          "placeId" text NOT NULL,
          "productId" text NOT NULL,
          "currentQuantity" integer NOT NULL DEFAULT 0,
          "minQuantity" integer NOT NULL DEFAULT 0,
          "includeInChecklist" boolean NOT NULL DEFAULT true,
          "lastCheckedAt" timestamptz,
          "lastCheckedBy" text,
          CONSTRAINT "InventoryStock_placeId_fkey"
            FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE,
          CONSTRAINT "InventoryStock_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE,
          CONSTRAINT "InventoryStock_currentQuantity_nonnegative"
            CHECK ("currentQuantity" >= 0),
          CONSTRAINT "InventoryStock_minQuantity_nonnegative"
            CHECK ("minQuantity" >= 0)
        )
      `);

      await executor.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "InventoryStock_placeId_productId_key"
        ON "InventoryStock" ("placeId", "productId")
      `);

      await executor.$executeRawUnsafe(`
        ALTER TABLE "InventoryStock"
        ADD COLUMN IF NOT EXISTS "includeInChecklist" boolean NOT NULL DEFAULT true
      `);

      await executor.$executeRawUnsafe(`
        ALTER TABLE "InventoryStock"
        ADD COLUMN IF NOT EXISTS "minQuantity" integer NOT NULL DEFAULT 0
      `);

      await executor.$executeRawUnsafe(`
        UPDATE "InventoryStock" s
        SET "minQuantity" = p."minQuantity"
        FROM "InventoryProduct" p
        WHERE s."productId" = p."id"
          AND s."minQuantity" = 0
          AND p."minQuantity" > 0
      `);

      await executor.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InventoryChecklist" (
          "id" text PRIMARY KEY,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now(),
          "checkDate" date NOT NULL,
          "status" text NOT NULL DEFAULT 'OPEN',
          "startedBy" text,
          "submittedBy" text,
          "submittedAt" timestamptz
        )
      `);

      await executor.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "InventoryChecklist_checkDate_key"
        ON "InventoryChecklist" ("checkDate")
      `);

      await executor.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InventoryChecklistItem" (
          "id" text PRIMARY KEY,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now(),
          "checklistId" text NOT NULL,
          "placeId" text NOT NULL,
          "productId" text NOT NULL,
          "expectedMinQuantity" integer NOT NULL DEFAULT 0,
          "countedQuantity" integer,
          "outOfStock" boolean NOT NULL DEFAULT false,
          "result" text NOT NULL DEFAULT 'PENDING',
          "notes" text,
          "checkedAt" timestamptz,
          "checkedBy" text,
          CONSTRAINT "InventoryChecklistItem_checklistId_fkey"
            FOREIGN KEY ("checklistId") REFERENCES "InventoryChecklist"("id") ON DELETE CASCADE,
          CONSTRAINT "InventoryChecklistItem_placeId_fkey"
            FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE RESTRICT,
          CONSTRAINT "InventoryChecklistItem_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE RESTRICT
        )
      `);

      await executor.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "InventoryChecklistItem_checklist_product_place_key"
        ON "InventoryChecklistItem" ("checklistId", "productId", "placeId")
      `);

      await executor.$executeRawUnsafe(`
        ALTER TABLE "InventoryChecklistItem"
        ADD COLUMN IF NOT EXISTS "outOfStock" boolean NOT NULL DEFAULT false
      `);

      await executor.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InventoryAlert" (
          "id" text PRIMARY KEY,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now(),
          "type" text NOT NULL,
          "severity" text NOT NULL,
          "status" text NOT NULL DEFAULT 'OPEN',
          "message" text NOT NULL,
          "placeId" text NOT NULL,
          "productId" text NOT NULL,
          "checklistId" text,
          "checklistItemId" text,
          "triggeredAt" timestamptz NOT NULL DEFAULT now(),
          "ackedAt" timestamptz,
          "ackedBy" text,
          "resolvedAt" timestamptz,
          "resolvedBy" text,
          CONSTRAINT "InventoryAlert_placeId_fkey"
            FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE,
          CONSTRAINT "InventoryAlert_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE,
          CONSTRAINT "InventoryAlert_checklistId_fkey"
            FOREIGN KEY ("checklistId") REFERENCES "InventoryChecklist"("id") ON DELETE SET NULL,
          CONSTRAINT "InventoryAlert_checklistItemId_fkey"
            FOREIGN KEY ("checklistItemId") REFERENCES "InventoryChecklistItem"("id") ON DELETE SET NULL
        )
      `);

      await executor.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "InventoryAlert_status_idx"
        ON "InventoryAlert" ("status", "type")
      `);

      await executor.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InventoryStockEvent" (
          "id" text PRIMARY KEY,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "eventType" text NOT NULL,
          "placeId" text NOT NULL,
          "productId" text NOT NULL,
          "beforeQuantity" integer,
          "afterQuantity" integer,
          "actorId" text,
          "source" text NOT NULL,
          "metadata" jsonb,
          CONSTRAINT "InventoryStockEvent_placeId_fkey"
            FOREIGN KEY ("placeId") REFERENCES "InventoryPlace"("id") ON DELETE CASCADE,
          CONSTRAINT "InventoryStockEvent_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "InventoryProduct"("id") ON DELETE CASCADE
        )
      `);

      await executor.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "InventoryStockEvent_place_product_createdAt_idx"
        ON "InventoryStockEvent" ("placeId", "productId", "createdAt")
      `);
    })();
  }

  await schemaReadyPromise;
}

async function getChecklistWithItemsById(
  executor: QueryExecutor,
  checklistId: string,
): Promise<InventoryChecklistWithItems> {
  const [checklistRow] = await executor.$queryRaw<ChecklistRow[]>`
    SELECT
      "id",
      "createdAt",
      "updatedAt",
      "checkDate",
      "status",
      "startedBy",
      "submittedBy",
      "submittedAt"
    FROM "InventoryChecklist"
    WHERE "id" = ${checklistId}
    LIMIT 1
  `;

  if (!checklistRow) {
    throw new InventoryError("NOT_FOUND", {
      service: "INVENTORY_CHECKLIST",
      id: checklistId,
    });
  }

  const itemRows = await executor.$queryRaw<ChecklistItemRow[]>`
    SELECT
      i."id",
      i."checklistId",
      i."placeId",
      i."productId",
      p."name" as "placeName",
      pr."name" as "productName",
      i."expectedMinQuantity",
      i."countedQuantity",
      i."outOfStock",
      i."result",
      i."notes",
      i."checkedAt",
      i."checkedBy"
    FROM "InventoryChecklistItem" i
    INNER JOIN "InventoryPlace" p ON p."id" = i."placeId"
    INNER JOIN "InventoryProduct" pr ON pr."id" = i."productId"
    WHERE i."checklistId" = ${checklistId}
    ORDER BY p."displayOrder" ASC NULLS LAST, p."createdAt" ASC, pr."name" ASC
  `;

  return {
    ...mapChecklist(checklistRow),
    items: itemRows.map(mapChecklistItem),
  };
}

async function getAlertById(executor: QueryExecutor, alertId: string): Promise<InventoryAlert> {
  const [alertRow] = await executor.$queryRaw<AlertRow[]>`
    SELECT
      a."id",
      a."createdAt",
      a."updatedAt",
      a."type",
      a."severity",
      a."status",
      a."message",
      a."placeId",
      a."productId",
      p."name" as "placeName",
      pr."name" as "productName",
      a."checklistId",
      a."checklistItemId",
      a."triggeredAt",
      a."ackedAt",
      a."ackedBy",
      a."resolvedAt",
      a."resolvedBy"
    FROM "InventoryAlert" a
    INNER JOIN "InventoryPlace" p ON p."id" = a."placeId"
    INNER JOIN "InventoryProduct" pr ON pr."id" = a."productId"
    WHERE a."id" = ${alertId}
    LIMIT 1
  `;

  if (!alertRow) {
    throw new InventoryError("NOT_FOUND", {
      service: "INVENTORY_ALERT",
      id: alertId,
    });
  }

  return mapAlert(alertRow);
}

class PrismaInventoryRepository implements InventoryRepository {
  async listPlaces(): Promise<InventoryPlace[]> {
    await ensureInventorySchema(prisma);

    const rows = await prisma.$queryRaw<PlaceRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "type",
        "active",
        "displayOrder",
        "notes"
      FROM "InventoryPlace"
      ORDER BY "displayOrder" ASC NULLS LAST, "createdAt" ASC
    `;

    return rows.map(mapPlace);
  }

  async createPlace(input: CreateInventoryPlaceInput): Promise<InventoryPlace> {
    await ensureInventorySchema(prisma);

    const [row] = await prisma.$queryRaw<PlaceRow[]>`
      INSERT INTO "InventoryPlace" (
        "id",
        "name",
        "type",
        "active",
        "displayOrder",
        "notes"
      ) VALUES (
        ${randomUUID()},
        ${input.name},
        ${input.type},
        ${input.active ?? true},
        ${input.displayOrder ?? null},
        ${input.notes ?? null}
      )
      RETURNING
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "type",
        "active",
        "displayOrder",
        "notes"
    `;

    return mapPlace(row);
  }

  async updatePlace(input: UpdateInventoryPlaceInput): Promise<InventoryPlace> {
    await ensureInventorySchema(prisma);

    const [existing] = await prisma.$queryRaw<PlaceRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "type",
        "active",
        "displayOrder",
        "notes"
      FROM "InventoryPlace"
      WHERE "id" = ${input.placeId}
      LIMIT 1
    `;

    if (!existing) {
      throw new InventoryError("NOT_FOUND", {
        service: "INVENTORY_PLACE",
        id: input.placeId,
      });
    }

    const [row] = await prisma.$queryRaw<PlaceRow[]>`
      UPDATE "InventoryPlace"
      SET
        "name" = ${input.name ?? existing.name},
        "type" = ${input.type ?? existing.type},
        "active" = ${input.active ?? existing.active},
        "displayOrder" = ${
          input.displayOrder === undefined ? existing.displayOrder : input.displayOrder
        },
        "notes" = ${input.notes === undefined ? existing.notes : input.notes},
        "updatedAt" = now()
      WHERE "id" = ${input.placeId}
      RETURNING
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "type",
        "active",
        "displayOrder",
        "notes"
    `;

    return mapPlace(row);
  }

  async listProducts(): Promise<InventoryProduct[]> {
    await ensureInventorySchema(prisma);

    const rows = await prisma.$queryRaw<ProductRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "unit",
        "active",
        "minQuantity",
        "alertThreshold",
        "requiresRefill",
        "notifyBelowThreshold",
        "notes"
      FROM "InventoryProduct"
      ORDER BY "name" ASC
    `;

    return rows.map(mapProduct);
  }

  async createProduct(input: CreateInventoryProductInput): Promise<InventoryProduct> {
    await ensureInventorySchema(prisma);

    const [row] = await prisma.$queryRaw<ProductRow[]>`
      INSERT INTO "InventoryProduct" (
        "id",
        "name",
        "unit",
        "active",
        "minQuantity",
        "alertThreshold",
        "requiresRefill",
        "notifyBelowThreshold",
        "notes"
      ) VALUES (
        ${randomUUID()},
        ${input.name},
        ${input.unit},
        ${input.active ?? true},
        ${input.minQuantity},
        ${input.alertThreshold ?? null},
        ${input.requiresRefill ?? false},
        ${input.notifyBelowThreshold ?? false},
        ${input.notes ?? null}
      )
      RETURNING
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "unit",
        "active",
        "minQuantity",
        "alertThreshold",
        "requiresRefill",
        "notifyBelowThreshold",
        "notes"
    `;

    return mapProduct(row);
  }

  async updateProduct(input: UpdateInventoryProductInput): Promise<InventoryProduct> {
    await ensureInventorySchema(prisma);

    const [existing] = await prisma.$queryRaw<ProductRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "unit",
        "active",
        "minQuantity",
        "alertThreshold",
        "requiresRefill",
        "notifyBelowThreshold",
        "notes"
      FROM "InventoryProduct"
      WHERE "id" = ${input.productId}
      LIMIT 1
    `;

    if (!existing) {
      throw new InventoryError("NOT_FOUND", {
        service: "INVENTORY_PRODUCT",
        id: input.productId,
      });
    }

    const [row] = await prisma.$queryRaw<ProductRow[]>`
      UPDATE "InventoryProduct"
      SET
        "name" = ${input.name ?? existing.name},
        "unit" = ${input.unit ?? existing.unit},
        "active" = ${input.active ?? existing.active},
        "minQuantity" = ${input.minQuantity ?? existing.minQuantity},
        "alertThreshold" = ${
          input.alertThreshold === undefined
            ? existing.alertThreshold
            : input.alertThreshold
        },
        "requiresRefill" = ${input.requiresRefill ?? existing.requiresRefill},
        "notifyBelowThreshold" = ${
          input.notifyBelowThreshold ?? existing.notifyBelowThreshold
        },
        "notes" = ${input.notes === undefined ? existing.notes : input.notes},
        "updatedAt" = now()
      WHERE "id" = ${input.productId}
      RETURNING
        "id",
        "createdAt",
        "updatedAt",
        "name",
        "unit",
        "active",
        "minQuantity",
        "alertThreshold",
        "requiresRefill",
        "notifyBelowThreshold",
        "notes"
    `;

    return mapProduct(row);
  }

  async listStocks(filters?: { placeId?: string | null }): Promise<InventoryStock[]> {
    await ensureInventorySchema(prisma);

    if (filters?.placeId) {
      const rows = await prisma.$queryRaw<StockRow[]>`
        SELECT
          s."id",
          s."createdAt",
          s."updatedAt",
          s."placeId",
          s."productId",
          p."name" as "placeName",
          pr."name" as "productName",
          s."currentQuantity",
          s."minQuantity",
          s."includeInChecklist",
          s."lastCheckedAt",
          s."lastCheckedBy"
        FROM "InventoryStock" s
        INNER JOIN "InventoryPlace" p ON p."id" = s."placeId"
        INNER JOIN "InventoryProduct" pr ON pr."id" = s."productId"
        WHERE s."placeId" = ${filters.placeId}
        ORDER BY p."displayOrder" ASC NULLS LAST, p."createdAt" ASC, pr."name" ASC
      `;

      return rows.map(mapStock);
    }

    const rows = await prisma.$queryRaw<StockRow[]>`
      SELECT
        s."id",
        s."createdAt",
        s."updatedAt",
        s."placeId",
        s."productId",
        p."name" as "placeName",
        pr."name" as "productName",
        s."currentQuantity",
        s."minQuantity",
        s."includeInChecklist",
        s."lastCheckedAt",
        s."lastCheckedBy"
      FROM "InventoryStock" s
      INNER JOIN "InventoryPlace" p ON p."id" = s."placeId"
      INNER JOIN "InventoryProduct" pr ON pr."id" = s."productId"
      ORDER BY p."displayOrder" ASC NULLS LAST, p."createdAt" ASC, pr."name" ASC
    `;

    return rows.map(mapStock);
  }

  async upsertStock(input: UpsertInventoryStockInput): Promise<InventoryStock> {
    await ensureInventorySchema(prisma);

    return prisma.$transaction(async (tx) => {
      const [place] = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "InventoryPlace" WHERE "id" = ${input.placeId} LIMIT 1
      `;

      if (!place) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_PLACE",
          id: input.placeId,
        });
      }

      const [product] = await tx.$queryRaw<{ id: string; minQuantity: number }[]>`
        SELECT "id", "minQuantity"
        FROM "InventoryProduct"
        WHERE "id" = ${input.productId}
        LIMIT 1
      `;

      if (!product) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_PRODUCT",
          id: input.productId,
        });
      }

      const [existing] = await tx.$queryRaw<
        {
          currentQuantity: number | null;
          minQuantity: number | null;
          includeInChecklist: boolean;
        }[]
      >`
        SELECT "currentQuantity", "minQuantity", "includeInChecklist"
        FROM "InventoryStock"
        WHERE "placeId" = ${input.placeId} AND "productId" = ${input.productId}
        LIMIT 1
      `;

      const includeInChecklistToPersist =
        input.includeInChecklist ?? existing?.includeInChecklist ?? true;
      const minQuantityToPersist =
        input.minQuantity ?? existing?.minQuantity ?? product.minQuantity ?? 0;

      await tx.$queryRaw`
        INSERT INTO "InventoryStock" (
          "id",
          "placeId",
          "productId",
          "currentQuantity",
          "minQuantity",
          "includeInChecklist",
          "lastCheckedAt",
          "lastCheckedBy"
        ) VALUES (
          ${randomUUID()},
          ${input.placeId},
          ${input.productId},
          ${input.currentQuantity},
          ${minQuantityToPersist},
          ${includeInChecklistToPersist},
          now(),
          ${input.actorId ?? null}
        )
        ON CONFLICT ("placeId", "productId")
        DO UPDATE SET
          "currentQuantity" = EXCLUDED."currentQuantity",
          "minQuantity" = EXCLUDED."minQuantity",
          "includeInChecklist" = EXCLUDED."includeInChecklist",
          "lastCheckedAt" = now(),
          "lastCheckedBy" = EXCLUDED."lastCheckedBy",
          "updatedAt" = now()
      `;

      await tx.$executeRaw`
        INSERT INTO "InventoryStockEvent" (
          "id",
          "eventType",
          "placeId",
          "productId",
          "beforeQuantity",
          "afterQuantity",
          "actorId",
          "source",
          "metadata"
        ) VALUES (
          ${randomUUID()},
          ${existing ? "STOCK_UPDATED" : "STOCK_CREATED"},
          ${input.placeId},
          ${input.productId},
          ${existing?.currentQuantity ?? null},
          ${input.currentQuantity},
          ${input.actorId ?? null},
          ${input.source ?? "MANUAL"},
          ${JSON.stringify({
            via: "inventory-stock-upsert",
            minQuantity: minQuantityToPersist,
          })}::jsonb
        )
      `;

      const [row] = await tx.$queryRaw<StockRow[]>`
        SELECT
          s."id",
          s."createdAt",
          s."updatedAt",
          s."placeId",
          s."productId",
          p."name" as "placeName",
          pr."name" as "productName",
          s."currentQuantity",
          s."minQuantity",
          s."includeInChecklist",
          s."lastCheckedAt",
          s."lastCheckedBy"
        FROM "InventoryStock" s
        INNER JOIN "InventoryPlace" p ON p."id" = s."placeId"
        INNER JOIN "InventoryProduct" pr ON pr."id" = s."productId"
        WHERE s."placeId" = ${input.placeId} AND s."productId" = ${input.productId}
        LIMIT 1
      `;

      return mapStock(row);
    });
  }

  async deleteStock(input: DeleteInventoryStockInput): Promise<InventoryStock> {
    await ensureInventorySchema(prisma);

    return prisma.$transaction(async (tx) => {
      const row = await getStockRowByPlaceAndProduct(tx, input.placeId, input.productId);

      if (!row) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_STOCK",
          id: `${input.placeId}:${input.productId}`,
        });
      }

      await tx.$executeRaw`
        DELETE FROM "InventoryStock"
        WHERE "placeId" = ${input.placeId}
          AND "productId" = ${input.productId}
      `;

      await tx.$executeRaw`
        INSERT INTO "InventoryStockEvent" (
          "id",
          "eventType",
          "placeId",
          "productId",
          "beforeQuantity",
          "afterQuantity",
          "actorId",
          "source",
          "metadata"
        ) VALUES (
          ${randomUUID()},
          'STOCK_DELETED',
          ${input.placeId},
          ${input.productId},
          ${row.currentQuantity},
          ${null},
          ${input.actorId ?? null},
          ${input.source ?? "MANUAL"},
          ${JSON.stringify({
            via: "inventory-stock-delete",
            minQuantity: row.minQuantity,
            includeInChecklist: row.includeInChecklist,
          })}::jsonb
        )
      `;

      return mapStock(row);
    });
  }

  async updateStockChecklistPrompt(
    input: UpdateInventoryStockChecklistPromptInput,
  ): Promise<InventoryStock> {
    await ensureInventorySchema(prisma);

    return prisma.$transaction(async (tx) => {
      const [existing] = await tx.$queryRaw<
        {
          currentQuantity: number;
          includeInChecklist: boolean;
        }[]
      >`
        SELECT "currentQuantity", "includeInChecklist"
        FROM "InventoryStock"
        WHERE "placeId" = ${input.placeId}
          AND "productId" = ${input.productId}
        FOR UPDATE
      `;

      if (!existing) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_STOCK",
          id: `${input.placeId}:${input.productId}`,
        });
      }

      await tx.$executeRaw`
        UPDATE "InventoryStock"
        SET
          "includeInChecklist" = ${input.includeInChecklist},
          "updatedAt" = now()
        WHERE "placeId" = ${input.placeId}
          AND "productId" = ${input.productId}
      `;

      await tx.$executeRaw`
        INSERT INTO "InventoryStockEvent" (
          "id",
          "eventType",
          "placeId",
          "productId",
          "beforeQuantity",
          "afterQuantity",
          "actorId",
          "source",
          "metadata"
        ) VALUES (
          ${randomUUID()},
          'CHECKLIST_PROMPT_UPDATED',
          ${input.placeId},
          ${input.productId},
          ${existing.currentQuantity},
          ${existing.currentQuantity},
          ${input.actorId ?? null},
          'SYSTEM',
          ${JSON.stringify({
            includeInChecklist: input.includeInChecklist,
          })}::jsonb
        )
      `;

      const row = await getStockRowByPlaceAndProduct(
        tx,
        input.placeId,
        input.productId,
      );

      if (!row) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_STOCK",
          id: `${input.placeId}:${input.productId}`,
        });
      }

      return mapStock(row);
    });
  }

  async transferStock(
    input: TransferInventoryStockInput,
  ): Promise<TransferInventoryStockResult> {
    await ensureInventorySchema(prisma);

    return prisma.$transaction(async (tx) => {
      const [fromPlace] = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "InventoryPlace"
        WHERE "id" = ${input.fromPlaceId}
        LIMIT 1
      `;

      if (!fromPlace) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_PLACE",
          id: input.fromPlaceId,
        });
      }

      const [toPlace] = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "InventoryPlace"
        WHERE "id" = ${input.toPlaceId}
        LIMIT 1
      `;

      if (!toPlace) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_PLACE",
          id: input.toPlaceId,
        });
      }

      const [product] = await tx.$queryRaw<{ id: string; minQuantity: number }[]>`
        SELECT "id", "minQuantity"
        FROM "InventoryProduct"
        WHERE "id" = ${input.productId}
        LIMIT 1
      `;

      if (!product) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_PRODUCT",
          id: input.productId,
        });
      }

      const [fromStockBefore] = await tx.$queryRaw<
        { currentQuantity: number; minQuantity: number }[]
      >`
        SELECT "currentQuantity", "minQuantity"
        FROM "InventoryStock"
        WHERE "placeId" = ${input.fromPlaceId}
          AND "productId" = ${input.productId}
        FOR UPDATE
      `;

      if (!fromStockBefore) {
        throw new InventoryError("CONFLICT", {
          reason: "SOURCE_STOCK_NOT_FOUND",
        });
      }

      if (fromStockBefore.currentQuantity < input.quantity) {
        throw new InventoryError("CONFLICT", {
          reason: "INSUFFICIENT_SOURCE_STOCK",
        });
      }

      const [toStockBefore] = await tx.$queryRaw<
        { currentQuantity: number; minQuantity: number }[]
      >`
        SELECT "currentQuantity", "minQuantity"
        FROM "InventoryStock"
        WHERE "placeId" = ${input.toPlaceId}
          AND "productId" = ${input.productId}
        FOR UPDATE
      `;

      const nextFromQuantity = fromStockBefore.currentQuantity - input.quantity;
      const nextToQuantity = (toStockBefore?.currentQuantity ?? 0) + input.quantity;
      const transferId = randomUUID();

      await tx.$queryRaw`
        UPDATE "InventoryStock"
        SET
          "currentQuantity" = ${nextFromQuantity},
          "lastCheckedAt" = now(),
          "lastCheckedBy" = ${input.actorId ?? null},
          "updatedAt" = now()
        WHERE "placeId" = ${input.fromPlaceId}
          AND "productId" = ${input.productId}
      `;

      await tx.$queryRaw`
        INSERT INTO "InventoryStock" (
          "id",
          "placeId",
          "productId",
          "currentQuantity",
          "minQuantity",
          "lastCheckedAt",
          "lastCheckedBy"
        ) VALUES (
          ${randomUUID()},
          ${input.toPlaceId},
          ${input.productId},
          ${nextToQuantity},
          ${toStockBefore?.minQuantity ?? product.minQuantity},
          now(),
          ${input.actorId ?? null}
        )
        ON CONFLICT ("placeId", "productId")
        DO UPDATE SET
          "currentQuantity" = EXCLUDED."currentQuantity",
          "lastCheckedAt" = now(),
          "lastCheckedBy" = EXCLUDED."lastCheckedBy",
          "updatedAt" = now()
      `;

      await tx.$executeRaw`
        INSERT INTO "InventoryStockEvent" (
          "id",
          "eventType",
          "placeId",
          "productId",
          "beforeQuantity",
          "afterQuantity",
          "actorId",
          "source",
          "metadata"
        ) VALUES (
          ${randomUUID()},
          'TRANSFER_OUT',
          ${input.fromPlaceId},
          ${input.productId},
          ${fromStockBefore.currentQuantity},
          ${nextFromQuantity},
          ${input.actorId ?? null},
          ${input.source ?? "MANUAL"},
          ${JSON.stringify({
            transferId,
            direction: "OUT",
            quantity: input.quantity,
            otherPlaceId: input.toPlaceId,
            checklistId: input.checklistId ?? null,
            checklistItemId: input.checklistItemId ?? null,
            notes: input.notes ?? null,
          })}::jsonb
        )
      `;

      await tx.$executeRaw`
        INSERT INTO "InventoryStockEvent" (
          "id",
          "eventType",
          "placeId",
          "productId",
          "beforeQuantity",
          "afterQuantity",
          "actorId",
          "source",
          "metadata"
        ) VALUES (
          ${randomUUID()},
          'TRANSFER_IN',
          ${input.toPlaceId},
          ${input.productId},
          ${toStockBefore?.currentQuantity ?? 0},
          ${nextToQuantity},
          ${input.actorId ?? null},
          ${input.source ?? "MANUAL"},
          ${JSON.stringify({
            transferId,
            direction: "IN",
            quantity: input.quantity,
            otherPlaceId: input.fromPlaceId,
            checklistId: input.checklistId ?? null,
            checklistItemId: input.checklistItemId ?? null,
            notes: input.notes ?? null,
          })}::jsonb
        )
      `;

      const fromRow = await getStockRowByPlaceAndProduct(
        tx,
        input.fromPlaceId,
        input.productId,
      );
      const toRow = await getStockRowByPlaceAndProduct(
        tx,
        input.toPlaceId,
        input.productId,
      );

      if (!fromRow || !toRow) {
        throw new InventoryError("CONFLICT", {
          reason: "TRANSFER_STATE_INVALID",
        });
      }

      return {
        fromStock: mapStock(fromRow),
        toStock: mapStock(toRow),
      };
    });
  }

  async openDailyChecklist(
    input: OpenDailyInventoryChecklistInput,
  ): Promise<InventoryChecklistWithItems> {
    await ensureInventorySchema(prisma);

    const floridaDate = toFloridaDate(input.date);

    return prisma.$transaction(async (tx) => {
      let [checklist] = await tx.$queryRaw<ChecklistRow[]>`
        SELECT
          "id",
          "createdAt",
          "updatedAt",
          "checkDate",
          "status",
          "startedBy",
          "submittedBy",
          "submittedAt"
        FROM "InventoryChecklist"
        WHERE "checkDate" = ${floridaDate}::date
        LIMIT 1
      `;

      if (!checklist) {
        [checklist] = await tx.$queryRaw<ChecklistRow[]>`
          INSERT INTO "InventoryChecklist" (
            "id",
            "checkDate",
            "status",
            "startedBy"
          ) VALUES (
            ${randomUUID()},
            ${floridaDate}::date,
            'OPEN',
            ${input.workerId ?? null}
          )
          RETURNING
            "id",
            "createdAt",
            "updatedAt",
            "checkDate",
            "status",
            "startedBy",
            "submittedBy",
            "submittedAt"
        `;
      }

      const [itemCountRow] = await tx.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as "count"
        FROM "InventoryChecklistItem"
        WHERE "checklistId" = ${checklist.id}
      `;

      if (Number(itemCountRow?.count ?? 0) === 0) {
        const rows = await tx.$queryRaw<
          {
            placeId: string;
            productId: string;
            minQuantity: number;
          }[]
        >`
          SELECT
            s."placeId",
            s."productId",
            s."minQuantity"
          FROM "InventoryStock" s
          INNER JOIN "InventoryPlace" p ON p."id" = s."placeId"
          INNER JOIN "InventoryProduct" pr ON pr."id" = s."productId"
          WHERE p."active" = true
            AND pr."active" = true
            AND s."includeInChecklist" = true
        `;

        for (const row of rows) {
          await tx.$executeRaw`
            INSERT INTO "InventoryChecklistItem" (
              "id",
              "checklistId",
              "placeId",
              "productId",
              "expectedMinQuantity",
              "result"
            ) VALUES (
              ${randomUUID()},
              ${checklist.id},
              ${row.placeId},
              ${row.productId},
              ${row.minQuantity},
              'PENDING'
            )
            ON CONFLICT ("checklistId", "productId", "placeId")
            DO NOTHING
          `;
        }
      }

      return getChecklistWithItemsById(tx, checklist.id);
    });
  }

  async getChecklistByDate(date: string): Promise<InventoryChecklistWithItems | null> {
    await ensureInventorySchema(prisma);

    const [checklist] = await prisma.$queryRaw<ChecklistRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "checkDate",
        "status",
        "startedBy",
        "submittedBy",
        "submittedAt"
      FROM "InventoryChecklist"
      WHERE "checkDate" = ${date}::date
      LIMIT 1
    `;

    if (!checklist) {
      return null;
    }

    return getChecklistWithItemsById(prisma, checklist.id);
  }

  async updateChecklistItem(
    input: UpdateInventoryChecklistItemInput,
  ): Promise<InventoryChecklistWithItems> {
    await ensureInventorySchema(prisma);

    return prisma.$transaction(async (tx) => {
      const [item] = await tx.$queryRaw<
        (ChecklistItemRow & { requiresRefill: boolean })[]
      >`
        SELECT
          i."id",
          i."checklistId",
          i."placeId",
          i."productId",
          p."name" as "placeName",
          pr."name" as "productName",
          i."expectedMinQuantity",
          i."countedQuantity",
          i."outOfStock",
          i."result",
          i."notes",
          i."checkedAt",
          i."checkedBy",
          pr."requiresRefill"
        FROM "InventoryChecklistItem" i
        INNER JOIN "InventoryPlace" p ON p."id" = i."placeId"
        INNER JOIN "InventoryProduct" pr ON pr."id" = i."productId"
        WHERE i."id" = ${input.itemId} AND i."checklistId" = ${input.checklistId}
        LIMIT 1
      `;

      if (!item) {
        throw new InventoryError("NOT_FOUND", {
          service: "INVENTORY_CHECKLIST_ITEM",
          id: input.itemId,
        });
      }

      const result =
        input.result ??
        deriveChecklistResult(
          input.countedQuantity,
          item.expectedMinQuantity,
          item.requiresRefill,
        );

      const missingToMin = Math.max(0, item.expectedMinQuantity - input.countedQuantity);
      let outOfStock = false;

      if (missingToMin > 0) {
        const [availabilityRow] = await tx.$queryRaw<{ quantity: number | null }[]>`
          SELECT COALESCE(SUM(GREATEST("currentQuantity" - "minQuantity", 0)), 0)::integer as "quantity"
          FROM "InventoryStock"
          WHERE "productId" = ${item.productId}
            AND "placeId" <> ${item.placeId}
            AND "currentQuantity" > 0
        `;

        outOfStock = Number(availabilityRow?.quantity ?? 0) < missingToMin;
      }

      await tx.$queryRaw`
        UPDATE "InventoryChecklistItem"
        SET
          "countedQuantity" = ${input.countedQuantity},
          "outOfStock" = ${outOfStock},
          "result" = ${result},
          "notes" = ${input.notes ?? null},
          "checkedAt" = now(),
          "checkedBy" = ${input.workerId ?? null},
          "updatedAt" = now()
        WHERE "id" = ${input.itemId}
      `;

      const [existingStock] = await tx.$queryRaw<{ currentQuantity: number | null }[]>`
        SELECT "currentQuantity"
        FROM "InventoryStock"
        WHERE "placeId" = ${item.placeId} AND "productId" = ${item.productId}
        LIMIT 1
      `;

      await tx.$queryRaw`
        INSERT INTO "InventoryStock" (
          "id",
          "placeId",
          "productId",
          "currentQuantity",
          "minQuantity",
          "lastCheckedAt",
          "lastCheckedBy"
        ) VALUES (
          ${randomUUID()},
          ${item.placeId},
          ${item.productId},
          ${input.countedQuantity},
          ${item.expectedMinQuantity},
          now(),
          ${input.workerId ?? null}
        )
        ON CONFLICT ("placeId", "productId")
        DO UPDATE SET
          "currentQuantity" = EXCLUDED."currentQuantity",
          "lastCheckedAt" = now(),
          "lastCheckedBy" = EXCLUDED."lastCheckedBy",
          "updatedAt" = now()
      `;

      await tx.$executeRaw`
        INSERT INTO "InventoryStockEvent" (
          "id",
          "eventType",
          "placeId",
          "productId",
          "beforeQuantity",
          "afterQuantity",
          "actorId",
          "source",
          "metadata"
        ) VALUES (
          ${randomUUID()},
          'CHECKLIST_ITEM_UPDATED',
          ${item.placeId},
          ${item.productId},
          ${existingStock?.currentQuantity ?? null},
          ${input.countedQuantity},
          ${input.workerId ?? null},
          'CHECKLIST',
          ${JSON.stringify({ checklistId: input.checklistId, itemId: input.itemId })}::jsonb
        )
      `;

      return getChecklistWithItemsById(tx, input.checklistId);
    });
  }

  async submitChecklist(
    input: SubmitInventoryChecklistInput,
  ): Promise<InventoryChecklistWithItems> {
    await ensureInventorySchema(prisma);

    return prisma.$transaction(async (tx) => {
      const checklist = await getChecklistWithItemsById(tx, input.checklistId);

      if (checklist.status !== "OPEN") {
        throw new InventoryError("CONFLICT", {
          reason: "CHECKLIST_NOT_OPEN",
        });
      }

      const pendingItems = checklist.items.filter(
        (item) => typeof item.countedQuantity !== "number",
      );

      if (pendingItems.length > 0) {
        throw new InventoryError("INVALID_PARAMS", {
          field: "countedQuantity",
          reason: "CHECKLIST_HAS_PENDING_ITEMS",
        });
      }

      await tx.$queryRaw`
        UPDATE "InventoryChecklist"
        SET
          "status" = 'SUBMITTED',
          "submittedBy" = ${input.workerId ?? null},
          "submittedAt" = now(),
          "updatedAt" = now()
        WHERE "id" = ${input.checklistId}
      `;

      const evaluatedRows = await tx.$queryRaw<AlertEvaluationRow[]>`
        SELECT
          i."placeId",
          i."productId",
          p."name" as "placeName",
          pr."name" as "productName",
          i."expectedMinQuantity",
          pr."alertThreshold",
          pr."requiresRefill",
          pr."notifyBelowThreshold",
          i."countedQuantity",
          i."id" as "checklistItemId"
        FROM "InventoryChecklistItem" i
        INNER JOIN "InventoryPlace" p ON p."id" = i."placeId"
        INNER JOIN "InventoryProduct" pr ON pr."id" = i."productId"
        WHERE i."checklistId" = ${input.checklistId}
      `;

      for (const row of evaluatedRows) {
        const requiredTypes = new Set<InventoryAlertType>();

        if (row.countedQuantity < row.expectedMinQuantity) {
          requiredTypes.add("LOW_STOCK");

          if (row.requiresRefill) {
            requiredTypes.add("REFILL");
          }
        }

        if (
          row.notifyBelowThreshold &&
          typeof row.alertThreshold === "number" &&
          row.countedQuantity < row.alertThreshold
        ) {
          requiredTypes.add("THRESHOLD");
        }

        const unresolvedAlerts = await tx.$queryRaw<
          { id: string; type: string; status: string }[]
        >`
          SELECT "id", "type", "status"
          FROM "InventoryAlert"
          WHERE "placeId" = ${row.placeId}
            AND "productId" = ${row.productId}
            AND "status" IN ('OPEN', 'ACKED')
        `;

        const unresolvedTypeSet = new Set(
          unresolvedAlerts.map((alert) => toAlertType(alert.type)),
        );

        for (const type of requiredTypes) {
          if (unresolvedTypeSet.has(type)) {
            continue;
          }

          const severity: InventoryAlertSeverity =
            type === "THRESHOLD"
              ? "CRITICAL"
              : type === "LOW_STOCK"
                ? "HIGH"
                : "MEDIUM";

          await tx.$executeRaw`
            INSERT INTO "InventoryAlert" (
              "id",
              "type",
              "severity",
              "status",
              "message",
              "placeId",
              "productId",
              "checklistId",
              "checklistItemId",
              "triggeredAt"
            ) VALUES (
              ${randomUUID()},
              ${type},
              ${severity},
              'OPEN',
              ${buildAlertMessage(type, row)},
              ${row.placeId},
              ${row.productId},
              ${input.checklistId},
              ${row.checklistItemId},
              now()
            )
          `;
        }

        for (const alert of unresolvedAlerts) {
          const alertType = toAlertType(alert.type);

          if (requiredTypes.has(alertType)) {
            continue;
          }

          await tx.$executeRaw`
            UPDATE "InventoryAlert"
            SET
              "status" = 'RESOLVED',
              "resolvedAt" = now(),
              "resolvedBy" = ${input.workerId ?? null},
              "updatedAt" = now()
            WHERE "id" = ${alert.id}
          `;
        }
      }

      return getChecklistWithItemsById(tx, input.checklistId);
    });
  }

  async listAlerts(filters?: ListInventoryAlertsInput): Promise<InventoryAlert[]> {
    await ensureInventorySchema(prisma);

    const rows = await prisma.$queryRaw<AlertRow[]>`
      SELECT
        a."id",
        a."createdAt",
        a."updatedAt",
        a."type",
        a."severity",
        a."status",
        a."message",
        a."placeId",
        a."productId",
        p."name" as "placeName",
        pr."name" as "productName",
        a."checklistId",
        a."checklistItemId",
        a."triggeredAt",
        a."ackedAt",
        a."ackedBy",
        a."resolvedAt",
        a."resolvedBy"
      FROM "InventoryAlert" a
      INNER JOIN "InventoryPlace" p ON p."id" = a."placeId"
      INNER JOIN "InventoryProduct" pr ON pr."id" = a."productId"
      WHERE
        (${filters?.status ?? null}::text IS NULL OR a."status" = ${filters?.status ?? null})
        AND (${filters?.placeId ?? null}::text IS NULL OR a."placeId" = ${filters?.placeId ?? null})
        AND (${filters?.productId ?? null}::text IS NULL OR a."productId" = ${filters?.productId ?? null})
      ORDER BY
        CASE a."severity"
          WHEN 'CRITICAL' THEN 0
          WHEN 'HIGH' THEN 1
          WHEN 'MEDIUM' THEN 2
          ELSE 3
        END ASC,
        a."triggeredAt" DESC
    `;

    return rows.map(mapAlert);
  }

  async ackAlert(input: AckInventoryAlertInput): Promise<InventoryAlert> {
    await ensureInventorySchema(prisma);

    await prisma.$executeRaw`
      UPDATE "InventoryAlert"
      SET
        "status" = CASE WHEN "status" = 'RESOLVED' THEN "status" ELSE 'ACKED' END,
        "ackedAt" = CASE WHEN "status" = 'RESOLVED' THEN "ackedAt" ELSE now() END,
        "ackedBy" = CASE WHEN "status" = 'RESOLVED' THEN "ackedBy" ELSE ${input.workerId ?? null} END,
        "updatedAt" = now()
      WHERE "id" = ${input.alertId}
    `;

    return getAlertById(prisma, input.alertId);
  }

  async resolveAlert(input: ResolveInventoryAlertInput): Promise<InventoryAlert> {
    await ensureInventorySchema(prisma);

    await prisma.$executeRaw`
      UPDATE "InventoryAlert"
      SET
        "status" = 'RESOLVED',
        "resolvedAt" = now(),
        "resolvedBy" = ${input.workerId ?? null},
        "updatedAt" = now()
      WHERE "id" = ${input.alertId}
    `;

    return getAlertById(prisma, input.alertId);
  }

  async getDashboard(date?: string | null): Promise<InventoryDashboard> {
    await ensureInventorySchema(prisma);

    const floridaDate = toFloridaDate(date);

    const [placeCountRow] = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as "count"
      FROM "InventoryPlace"
      WHERE "active" = true
    `;

    const [productCountRow] = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as "count"
      FROM "InventoryProduct"
      WHERE "active" = true
    `;

    const [belowMinimumRow] = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as "count"
      FROM "InventoryStock" s
      INNER JOIN "InventoryProduct" p ON p."id" = s."productId"
      WHERE p."active" = true AND s."currentQuantity" < s."minQuantity"
    `;

    const [refillRequiredRow] = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as "count"
      FROM "InventoryStock" s
      INNER JOIN "InventoryProduct" p ON p."id" = s."productId"
      WHERE p."active" = true
        AND p."requiresRefill" = true
        AND s."currentQuantity" < s."minQuantity"
    `;

    const [openAlertRow] = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as "count"
      FROM "InventoryAlert"
      WHERE "status" IN ('OPEN', 'ACKED')
    `;

    const [todayChecklist] = await prisma.$queryRaw<
      {
        id: string;
        status: string;
        itemCount: bigint;
        checkedCount: bigint;
      }[]
    >`
      SELECT
        c."id",
        c."status",
        COUNT(i."id")::bigint as "itemCount",
        COUNT(i."id") FILTER (WHERE i."countedQuantity" IS NOT NULL)::bigint as "checkedCount"
      FROM "InventoryChecklist" c
      LEFT JOIN "InventoryChecklistItem" i ON i."checklistId" = c."id"
      WHERE c."checkDate" = ${floridaDate}::date
      GROUP BY c."id", c."status"
      LIMIT 1
    `;

    return {
      floridaDate,
      totalActivePlaces: Number(placeCountRow?.count ?? 0),
      totalActiveProducts: Number(productCountRow?.count ?? 0),
      belowMinimumCount: Number(belowMinimumRow?.count ?? 0),
      refillRequiredCount: Number(refillRequiredRow?.count ?? 0),
      openAlertCount: Number(openAlertRow?.count ?? 0),
      todayChecklist: todayChecklist
        ? {
            id: todayChecklist.id,
            status: toChecklistStatus(todayChecklist.status),
            itemCount: Number(todayChecklist.itemCount),
            checkedCount: Number(todayChecklist.checkedCount),
          }
        : null,
    };
  }
}

export const prismaInventoryRepository = new PrismaInventoryRepository();
