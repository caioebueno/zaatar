import { ackInventoryAlertUseCase } from "../../application/ackInventoryAlert.js";
import { createInventoryPlaceUseCase } from "../../application/createInventoryPlace.js";
import { createInventoryProductUseCase } from "../../application/createInventoryProduct.js";
import { deleteInventoryStockUseCase } from "../../application/deleteInventoryStock.js";
import { getInventoryDashboardUseCase } from "../../application/getInventoryDashboard.js";
import { getTodayInventoryChecklistUseCase } from "../../application/getTodayInventoryChecklist.js";
import { listInventoryAlertsUseCase } from "../../application/listInventoryAlerts.js";
import { listInventoryPlacesUseCase } from "../../application/listInventoryPlaces.js";
import { listInventoryProductsUseCase } from "../../application/listInventoryProducts.js";
import { listInventoryStocksUseCase } from "../../application/listInventoryStocks.js";
import { openDailyInventoryChecklistUseCase } from "../../application/openDailyInventoryChecklist.js";
import { resolveInventoryAlertUseCase } from "../../application/resolveInventoryAlert.js";
import { submitInventoryChecklistUseCase } from "../../application/submitInventoryChecklist.js";
import { transferInventoryStockUseCase } from "../../application/transferInventoryStock.js";
import { updateInventoryChecklistItemUseCase } from "../../application/updateInventoryChecklistItem.js";
import { updateInventoryPlaceUseCase } from "../../application/updateInventoryPlace.js";
import { updateInventoryProductUseCase } from "../../application/updateInventoryProduct.js";
import { updateInventoryStockChecklistPromptUseCase } from "../../application/updateInventoryStockChecklistPrompt.js";
import { upsertInventoryStockUseCase } from "../../application/upsertInventoryStock.js";
import { InventoryError } from "../../domain/inventory.errors.js";
import type { InventoryRepository } from "../../domain/inventory.repository.js";
import type {
  InventoryAlertStatus,
  InventoryChecklistItemResult,
  InventoryPlaceType,
} from "../../domain/inventory.types.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

const INVENTORY_PREFIX = /^\/(?:api\/)?inventory/;

export class InventoryController implements HttpController {
  constructor(private readonly repository: InventoryRepository) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.auth?.userId) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }

    const url = new URL(normalizeInventoryPath(request.path), "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "GET" && pathname === "/inventory/places") {
        const places = await listInventoryPlacesUseCase(this.repository);
        return { statusCode: 200, body: places };
      }

      if (request.method === "POST" && pathname === "/inventory/places") {
        const body = toObject(request.body);
        const place = await createInventoryPlaceUseCase(this.repository, {
          name: parseString(body.name, "name"),
          type: parseString(body.type, "type") as InventoryPlaceType,
          active: parseOptionalBoolean(body.active, "active"),
          displayOrder: parseOptionalNullableInt(body.displayOrder, "displayOrder"),
          notes: parseNullableString(body.notes, "notes"),
        });
        return { statusCode: 201, body: place };
      }

      const placeId = extractPathParam(pathname, /^\/inventory\/places\/([^/]+)$/);
      if (request.method === "PATCH" && placeId) {
        const body = toObject(request.body);
        const place = await updateInventoryPlaceUseCase(this.repository, {
          placeId,
          name: parseOptionalString(body.name, "name"),
          type: parseOptionalString(body.type, "type") as InventoryPlaceType | undefined,
          active: parseOptionalBoolean(body.active, "active"),
          displayOrder: parseOptionalNullableInt(body.displayOrder, "displayOrder"),
          notes: parseNullableString(body.notes, "notes"),
        });
        return { statusCode: 200, body: place };
      }

      if (request.method === "GET" && pathname === "/inventory/products") {
        const products = await listInventoryProductsUseCase(this.repository);
        return { statusCode: 200, body: products };
      }

      if (request.method === "POST" && pathname === "/inventory/products") {
        const body = toObject(request.body);
        const product = await createInventoryProductUseCase(this.repository, {
          name: parseString(body.name, "name"),
          unit: parseString(body.unit, "unit"),
          active: parseOptionalBoolean(body.active, "active"),
          minQuantity: parseRequiredInt(body.minQuantity, "minQuantity"),
          alertThreshold: parseOptionalNullableInt(body.alertThreshold, "alertThreshold"),
          requiresRefill: parseOptionalBoolean(body.requiresRefill, "requiresRefill"),
          notes: parseNullableString(body.notes, "notes"),
        });
        return { statusCode: 201, body: product };
      }

      const productId = extractPathParam(pathname, /^\/inventory\/products\/([^/]+)$/);
      if (request.method === "PATCH" && productId) {
        const body = toObject(request.body);
        const product = await updateInventoryProductUseCase(this.repository, {
          productId,
          name: parseOptionalString(body.name, "name"),
          unit: parseOptionalString(body.unit, "unit"),
          active: parseOptionalBoolean(body.active, "active"),
          minQuantity: parseOptionalNullableInt(body.minQuantity, "minQuantity") ?? undefined,
          alertThreshold: parseOptionalNullableInt(body.alertThreshold, "alertThreshold"),
          requiresRefill: parseOptionalBoolean(body.requiresRefill, "requiresRefill"),
          notes: parseNullableString(body.notes, "notes"),
        });
        return { statusCode: 200, body: product };
      }

      if (request.method === "GET" && pathname === "/inventory/stocks") {
        const stocks = await listInventoryStocksUseCase(this.repository, {
          placeId: url.searchParams.get("placeId") || null,
        });
        return { statusCode: 200, body: stocks };
      }

      if (request.method === "POST" && pathname === "/inventory/stocks") {
        const body = toObject(request.body);
        const minQuantity = parseOptionalNullableInt(body.minQuantity, "minQuantity");
        const stock = await upsertInventoryStockUseCase(this.repository, {
          placeId: parseString(body.placeId, "placeId"),
          productId: parseString(body.productId, "productId"),
          currentQuantity: parseRequiredInt(body.currentQuantity, "currentQuantity"),
          minQuantity: minQuantity === null ? undefined : minQuantity,
          notifyBelowThreshold: parseOptionalBoolean(
            body.notifyBelowThreshold,
            "notifyBelowThreshold",
          ),
          includeInChecklist: parseOptionalBoolean(
            body.includeInChecklist,
            "includeInChecklist",
          ),
          actorId: parseOptionalString(body.actorId, "actorId") ?? null,
          source: (parseOptionalString(body.source, "source") as
            | "MANUAL"
            | "CHECKLIST"
            | "SYSTEM"
            | undefined) ?? "MANUAL",
        });
        return { statusCode: 200, body: stock };
      }

      if (request.method === "DELETE" && pathname === "/inventory/stocks") {
        const body = toObject(request.body);
        const deleted = await deleteInventoryStockUseCase(this.repository, {
          placeId: parseString(body.placeId, "placeId"),
          productId: parseString(body.productId, "productId"),
          actorId: parseOptionalString(body.actorId, "actorId") ?? null,
          source: (parseOptionalString(body.source, "source") as
            | "MANUAL"
            | "SYSTEM"
            | undefined) ?? "MANUAL",
        });
        return { statusCode: 200, body: deleted };
      }

      if (request.method === "PATCH" && pathname === "/inventory/stocks/prompt") {
        const body = toObject(request.body);
        const stock = await updateInventoryStockChecklistPromptUseCase(
          this.repository,
          {
            placeId: parseString(body.placeId, "placeId"),
            productId: parseString(body.productId, "productId"),
            includeInChecklist: parseRequiredBoolean(
              body.includeInChecklist,
              "includeInChecklist",
            ),
            actorId: parseOptionalString(body.actorId, "actorId") ?? null,
          },
        );
        return { statusCode: 200, body: stock };
      }

      if (request.method === "POST" && pathname === "/inventory/stocks/transfer") {
        const body = toObject(request.body);
        const transfer = await transferInventoryStockUseCase(this.repository, {
          fromPlaceId: parseString(body.fromPlaceId, "fromPlaceId"),
          toPlaceId: parseString(body.toPlaceId, "toPlaceId"),
          productId: parseString(body.productId, "productId"),
          quantity: parseRequiredInt(body.quantity, "quantity"),
          actorId: parseOptionalString(body.actorId, "actorId") ?? null,
          source: (parseOptionalString(body.source, "source") as
            | "MANUAL"
            | "CHECKLIST"
            | "SYSTEM"
            | undefined) ?? "MANUAL",
          checklistId: parseOptionalString(body.checklistId, "checklistId") ?? null,
          checklistItemId:
            parseOptionalString(body.checklistItemId, "checklistItemId") ?? null,
          notes: parseNullableString(body.notes, "notes") ?? null,
        });
        return { statusCode: 200, body: transfer };
      }

      if (
        request.method === "POST" &&
        pathname === "/inventory/checklists/daily/open"
      ) {
        const body = toObject(request.body);
        const checklist = await openDailyInventoryChecklistUseCase(this.repository, {
          workerId: parseOptionalString(body.workerId, "workerId") ?? null,
          date: parseOptionalString(body.date, "date") ?? null,
        });
        return { statusCode: 201, body: checklist };
      }

      if (request.method === "GET" && pathname === "/inventory/checklists/today") {
        const checklist = await getTodayInventoryChecklistUseCase(
          this.repository,
          url.searchParams.get("date")?.trim() ||
            new Intl.DateTimeFormat("en-CA", {
              timeZone: "America/New_York",
            }).format(new Date()),
        );
        return { statusCode: 200, body: checklist };
      }

      const checklistItemMatch = pathname.match(
        /^\/inventory\/checklists\/([^/]+)\/items\/([^/]+)$/,
      );
      if (request.method === "PATCH" && checklistItemMatch) {
        const body = toObject(request.body);
        const checklist = await updateInventoryChecklistItemUseCase(
          this.repository,
          {
            checklistId: checklistItemMatch[1],
            itemId: checklistItemMatch[2],
            countedQuantity: parseRequiredInt(
              body.countedQuantity,
              "countedQuantity",
            ),
            notes: parseNullableString(body.notes, "notes") ?? null,
            result: (parseOptionalString(body.result, "result") as
              | InventoryChecklistItemResult
              | undefined) ?? null,
            workerId: parseOptionalString(body.workerId, "workerId") ?? null,
          },
        );
        return { statusCode: 200, body: checklist };
      }

      const checklistSubmitId = extractPathParam(
        pathname,
        /^\/inventory\/checklists\/([^/]+)\/submit$/,
      );
      if (request.method === "POST" && checklistSubmitId) {
        const body = toObject(request.body);
        const checklist = await submitInventoryChecklistUseCase(this.repository, {
          checklistId: checklistSubmitId,
          workerId: parseOptionalString(body.workerId, "workerId") ?? null,
        });
        return { statusCode: 200, body: checklist };
      }

      if (request.method === "GET" && pathname === "/inventory/alerts") {
        const alerts = await listInventoryAlertsUseCase(this.repository, {
          status: (url.searchParams.get("status")?.trim() as InventoryAlertStatus | null) ?? null,
          placeId: url.searchParams.get("placeId")?.trim() || null,
          productId: url.searchParams.get("productId")?.trim() || null,
        });
        return { statusCode: 200, body: alerts };
      }

      const ackAlertId = extractPathParam(pathname, /^\/inventory\/alerts\/([^/]+)\/ack$/);
      if (request.method === "PATCH" && ackAlertId) {
        const body = toObject(request.body);
        const alert = await ackInventoryAlertUseCase(this.repository, {
          alertId: ackAlertId,
          workerId: parseOptionalString(body.workerId, "workerId") ?? null,
        });
        return { statusCode: 200, body: alert };
      }

      const resolveAlertId = extractPathParam(
        pathname,
        /^\/inventory\/alerts\/([^/]+)\/resolve$/,
      );
      if (request.method === "PATCH" && resolveAlertId) {
        const body = toObject(request.body);
        const alert = await resolveInventoryAlertUseCase(this.repository, {
          alertId: resolveAlertId,
          workerId: parseOptionalString(body.workerId, "workerId") ?? null,
        });
        return { statusCode: 200, body: alert };
      }

      if (request.method === "GET" && pathname === "/inventory/dashboard") {
        const dashboard = await getInventoryDashboardUseCase(
          this.repository,
          url.searchParams.get("date")?.trim() || null,
        );
        return { statusCode: 200, body: dashboard };
      }

      return { statusCode: 404, body: { error: "Not found" } };
    } catch (error) {
      return inventoryErrorResponse(error);
    }
  }
}

function normalizeInventoryPath(path: string): string {
  const url = new URL(path, "http://localhost");
  const pathname = url.pathname.replace(INVENTORY_PREFIX, "/inventory");
  return `${pathname}${url.search}`;
}

function extractPathParam(pathname: string, matcher: RegExp): string | null {
  const match = pathname.match(matcher);
  return match ? decodeURIComponent(match[1]) : null;
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  return normalized;
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }
  return value;
}

function parseNullableString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }
  const normalized = value.trim();
  return normalized || null;
}

function parseOptionalBoolean(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }
  return value;
}

function parseRequiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }
  return value;
}

function parseOptionalNullableInt(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InventoryError("INVALID_PARAMS", { field });
  }
  return value;
}

function parseRequiredInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InventoryError("INVALID_PARAMS", { field });
  }
  return value;
}

function inventoryErrorResponse(error: unknown): HttpResponse {
  if (error instanceof InventoryError) {
    if (error.code === "INVALID_PARAMS") {
      return {
        statusCode: 400,
        body: {
          error: "Invalid payload",
          ...(error.details.field ? { field: error.details.field } : {}),
          ...(error.details.reason ? { reason: error.details.reason } : {}),
        },
      };
    }

    if (error.code === "NOT_FOUND") {
      return {
        statusCode: 404,
        body: {
          error: "Not found",
          ...(error.details.service ? { service: error.details.service } : {}),
          ...(error.details.id ? { id: error.details.id } : {}),
        },
      };
    }

    if (error.code === "CONFLICT") {
      return {
        statusCode: 409,
        body: {
          error: "Conflict",
          ...(error.details.reason ? { reason: error.details.reason } : {}),
        },
      };
    }
  }

  console.error("[inventory] request failed", error);
  return { statusCode: 500, body: { error: "Internal Server Error" } };
}
