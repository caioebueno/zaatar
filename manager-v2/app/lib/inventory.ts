import { ApiError } from "./api";
import { getManagerBusinessId, getManagerToken } from "./auth";

/**
 * Client for the inventory / stock API on the manager API server (`/inventory/...`).
 * All routes require manager auth (Authorization: Bearer <token> + x-business-id).
 * Date logic runs in America/New_York with YYYY-MM-DD checklist dates.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const BASE = `${API_BASE_URL.replace(/\/$/, "")}/inventory`;

// ── Types (mirror the inventory domain) ─────────────────────────────────────
export type InventoryPlaceType = "FRIDGE" | "FREEZER" | "SHELF" | "PANTRY" | "OTHER";
export type InventoryChecklistStatus = "OPEN" | "SUBMITTED" | "REVIEWED";
export type InventoryChecklistItemResult = "PENDING" | "OK" | "BELOW_MIN" | "REFILL_NEEDED" | "OUT_OF_STOCK";
export type InventoryAlertType = "LOW_STOCK" | "THRESHOLD" | "REFILL";
export type InventoryAlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type InventoryAlertStatus = "OPEN" | "ACKED" | "RESOLVED";
export type InventoryStockSource = "MANUAL" | "CHECKLIST" | "SYSTEM";

export type InventoryPlace = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  type: InventoryPlaceType;
  active: boolean;
  displayOrder: number | null;
  notes: string | null;
};

export type InventoryProduct = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  unit: string;
  active: boolean;
  minQuantity: number;
  alertThreshold: number | null;
  requiresRefill: boolean;
  notes: string | null;
};

export type InventoryStock = {
  id: string;
  createdAt: string;
  updatedAt: string;
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  currentQuantity: number;
  minQuantity: number;
  notifyBelowThreshold: boolean;
  includeInChecklist: boolean;
  lastCheckedAt: string | null;
  lastCheckedBy: string | null;
};

export type InventoryChecklistItem = {
  id: string;
  checklistId: string;
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  expectedMinQuantity: number;
  countedQuantity: number | null;
  outOfStock: boolean;
  result: InventoryChecklistItemResult;
  notes: string | null;
  checkedAt: string | null;
  checkedBy: string | null;
};

export type InventoryChecklistWithItems = {
  id: string;
  createdAt: string;
  updatedAt: string;
  checkDate: string;
  status: InventoryChecklistStatus;
  startedBy: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  items: InventoryChecklistItem[];
};

export type InventoryAlert = {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: InventoryAlertType;
  severity: InventoryAlertSeverity;
  status: InventoryAlertStatus;
  message: string;
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  checklistId: string | null;
  checklistItemId: string | null;
  triggeredAt: string;
  ackedAt: string | null;
  ackedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type InventoryDashboard = {
  floridaDate: string;
  totalActivePlaces: number;
  totalActiveProducts: number;
  belowMinimumCount: number;
  refillRequiredCount: number;
  openAlertCount: number;
  todayChecklist: { id: string; status: InventoryChecklistStatus; itemCount: number; checkedCount: number } | null;
};

// ── Transport ───────────────────────────────────────────────────────────────
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getManagerToken();
  if (!token) throw new ApiError(401, { error: "Unauthorized" });
  const businessId = getManagerBusinessId();
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (businessId) headers["x-business-id"] = businessId;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, credentials: "omit" });
  } catch {
    throw new ApiError(0, { error: "Network error" });
  }
  if (!res.ok) {
    let data: Record<string, unknown> = {};
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      data = {};
    }
    throw new ApiError(res.status, data);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const invGet = <T>(path: string) => request<T>("GET", path);

// ── Places ──────────────────────────────────────────────────────────────────
export function listInventoryPlaces() {
  return invGet<InventoryPlace[]>("/places");
}
export type CreatePlaceBody = { name: string; type: InventoryPlaceType; active?: boolean; displayOrder?: number | null; notes?: string | null };
export function createInventoryPlace(body: CreatePlaceBody) {
  return request<InventoryPlace>("POST", "/places", body);
}
export type UpdatePlaceBody = Partial<CreatePlaceBody>;
export function updateInventoryPlace(placeId: string, body: UpdatePlaceBody) {
  return request<InventoryPlace>("PATCH", `/places/${encodeURIComponent(placeId)}`, body);
}

// ── Products ──────────────────────────────────────────────────────────────────
export function listInventoryProducts() {
  return invGet<InventoryProduct[]>("/products");
}
export type CreateProductBody = { name: string; unit: string; minQuantity: number; active?: boolean; alertThreshold?: number | null; requiresRefill?: boolean; notes?: string | null };
export function createInventoryProduct(body: CreateProductBody) {
  return request<InventoryProduct>("POST", "/products", body);
}
export type UpdateProductBody = Partial<CreateProductBody>;
export function updateInventoryProduct(productId: string, body: UpdateProductBody) {
  return request<InventoryProduct>("PATCH", `/products/${encodeURIComponent(productId)}`, body);
}

// ── Stocks ────────────────────────────────────────────────────────────────────
export function listInventoryStocks(placeId?: string | null) {
  return invGet<InventoryStock[]>(`/stocks${placeId ? `?placeId=${encodeURIComponent(placeId)}` : ""}`);
}
export type UpsertStockBody = { placeId: string; productId: string; currentQuantity: number; minQuantity?: number; notifyBelowThreshold?: boolean; includeInChecklist?: boolean; source?: InventoryStockSource };
/** POST /stocks — create or update one stock row. `currentQuantity` is absolute. */
export function upsertInventoryStock(body: UpsertStockBody) {
  return request<InventoryStock>("POST", "/stocks", { source: "MANUAL", ...body });
}
export function deleteInventoryStock(placeId: string, productId: string) {
  return request<{ placeId: string; productId: string }>("DELETE", "/stocks", { placeId, productId, source: "MANUAL" });
}
export function setInventoryStockPrompt(placeId: string, productId: string, includeInChecklist: boolean) {
  return request<InventoryStock>("PATCH", "/stocks/prompt", { placeId, productId, includeInChecklist });
}
export type TransferStockBody = { fromPlaceId: string; toPlaceId: string; productId: string; quantity: number; notes?: string | null };
export function transferInventoryStock(body: TransferStockBody) {
  return request<unknown>("POST", "/stocks/transfer", { source: "MANUAL", ...body });
}

// ── Checklists ────────────────────────────────────────────────────────────────
export function openDailyChecklist(date?: string) {
  return request<InventoryChecklistWithItems>("POST", "/checklists/daily/open", date ? { date } : {});
}
export function getTodayChecklist(date?: string) {
  return invGet<InventoryChecklistWithItems | null>(`/checklists/today${date ? `?date=${encodeURIComponent(date)}` : ""}`);
}
export type CountChecklistItemBody = { countedQuantity: number; notes?: string | null; result?: InventoryChecklistItemResult };
export function countChecklistItem(checklistId: string, itemId: string, body: CountChecklistItemBody) {
  return request<InventoryChecklistWithItems>("PATCH", `/checklists/${encodeURIComponent(checklistId)}/items/${encodeURIComponent(itemId)}`, body);
}
export function submitChecklist(checklistId: string) {
  return request<InventoryChecklistWithItems>("POST", `/checklists/${encodeURIComponent(checklistId)}/submit`, {});
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export function listInventoryAlerts(query: { status?: InventoryAlertStatus; placeId?: string; productId?: string } = {}) {
  const p = new URLSearchParams();
  if (query.status) p.set("status", query.status);
  if (query.placeId) p.set("placeId", query.placeId);
  if (query.productId) p.set("productId", query.productId);
  const qs = p.toString();
  return invGet<InventoryAlert[]>(`/alerts${qs ? `?${qs}` : ""}`);
}
export function ackInventoryAlert(alertId: string) {
  return request<InventoryAlert>("PATCH", `/alerts/${encodeURIComponent(alertId)}/ack`, {});
}
export function resolveInventoryAlert(alertId: string) {
  return request<InventoryAlert>("PATCH", `/alerts/${encodeURIComponent(alertId)}/resolve`, {});
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function getInventoryDashboard(date?: string) {
  return invGet<InventoryDashboard>(`/dashboard${date ? `?date=${encodeURIComponent(date)}` : ""}`);
}

/** Today's date in America/New_York as YYYY-MM-DD (checklist/dashboard date key). */
export function floridaDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
