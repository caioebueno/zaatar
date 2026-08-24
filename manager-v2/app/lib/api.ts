/**
 * Client for the Foody API server (default http://localhost:4000).
 * Owner (manager) auth: OTP send + verify.
 * See api/src/modules/owner for the source contract.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * Public host that serves bucket files. Uploads return a proxy path like
 * `/api/bucket/<key>`; this host turns it into a renderable public URL.
 */
export const FILE_API_BASE_URL =
  process.env.NEXT_PUBLIC_FILE_API_BASE_URL ?? "https://s3-public-presigner-production-83b6.up.railway.app";

/** Business timezone — Orlando, FL (Eastern Time). Used for date-range analytics/order queries. */
export const APP_TIMEZONE = "America/New_York";

export type OwnerBusiness = { id: string; name: string };

export type OwnerProfile = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

export type SendOtpResult = {
  ok: boolean;
  expiresInMinutes: number;
};

export type VerifyOtpResult = {
  ok: boolean;
  accessToken: string;
  expiresAt: string;
  owner: OwnerProfile;
  selectedBusinessId: string | null;
  businesses: OwnerBusiness[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly reason?: string;
  readonly field?: string;
  readonly remainingAttempts?: number;

  constructor(
    status: number,
    body: Record<string, unknown>,
  ) {
    super(typeof body?.error === "string" ? body.error : `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.reason = typeof body?.reason === "string" ? body.reason : undefined;
    this.field = typeof body?.field === "string" ? body.field : undefined;
    this.remainingAttempts =
      typeof body?.remainingAttempts === "number" ? body.remainingAttempts : undefined;
  }
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // The API sends `Access-Control-Allow-Origin: *`, which forbids credentialed
      // requests. We authenticate via the Authorization header instead of cookies.
      credentials: "omit",
    });
  } catch {
    // Network / CORS failure — surface as a synthetic ApiError.
    throw new ApiError(0, { error: "Network error" });
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

/**
 * Builds the API `phone` value: digits with country code, no `+`.
 * e.g. dialCode "+1" + national "(415) 555-0132" -> "14155550132".
 */
export function toApiPhone(dialCode: string, nationalNumber: string): string {
  return dialCode.replace(/\D/g, "") + nationalNumber.replace(/\D/g, "");
}

export function sendOwnerOtp(phone: string, language = "en"): Promise<SendOtpResult> {
  return post<SendOtpResult>("/owners/auth/otp/send", { phone, language });
}

export function verifyOwnerOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  return post<VerifyOtpResult>("/owners/auth/otp/verify", { phone, code });
}

export type BusinessListItem = { id: string; name: string; logoUrl: string | null };

export type ListBusinessesResult = {
  selectedBusinessId: string | null;
  items: BusinessListItem[];
};

export type OrderListPayment = {
  amount: number;
  paidAt: string | null;
  paymentType: "CARD" | "CASH" | "ZELLE";
  paymentProvider: "STRIPE" | null;
  externalId: string | null;
};

export type OrderModifierItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
};

export type OrderLineItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitAmountCents: number;
  lineTotalCents: number;
  modifierGroupItems?: OrderModifierItem[];
};

export type OrderListItem = {
  id: string;
  number: string | null;
  createdAt: string;
  orderType: "DELIVERY" | "TAKEAWAY";
  paymentMethod: "CARD" | "CASH" | "ZELLE";
  payments: OrderListPayment[];
  status: string;
  canceled: boolean;
  customer: { name: string | null; phone: string | null };
  items: OrderLineItem[];
  subtotalCents: number;
  discountedSubtotalCents: number;
  tipPercent: number;
  tipAmountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};

export type ListOrdersV1Response = {
  items: OrderListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ListOrdersParams = {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  timezone?: string;
  includeCanceled?: boolean;
  businessId?: string | null;
};

/** GET /v1/order — paginated order list for the authenticated manager. */
export async function listOrdersV1(token: string, params: ListOrdersParams): Promise<ListOrdersV1Response> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.timezone) qs.set("timezone", params.timezone);
  if (params.includeCanceled) qs.set("includeCanceled", "true");

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (params.businessId) headers["x-business-id"] = params.businessId;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/v1/order?${qs.toString()}`, { method: "GET", headers, credentials: "omit" });
  } catch {
    throw new ApiError(0, { error: "Network error" });
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as unknown as ListOrdersV1Response;
}

export type ApiModifierItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  translations?: unknown | null;
  photo?: { id: string; url: string } | null;
};

export type ApiModifierGroup = {
  id: string;
  title: string;
  translations?: unknown | null;
  required: boolean;
  type: "MULTI" | "SINGLE" | null;
  minSelection: number | null;
  maxSelection: number | null;
  items: ApiModifierItem[];
};

export type ApiProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number | null;
  comparedAtPrice?: number | null;
  visible: boolean;
  alertDriver: boolean;
  itemType: "PRODUCT" | "COMBO";
  categoryId?: string | null;
  categoryIds?: string[];
  categoryEntries?: { categoryId: string; categoryIndex: number | null }[];
  translations?: Record<string, unknown> | null;
  photos?: { id: string; name: string; url: string }[];
  modifierGroups?: ApiModifierGroup[];
  preparationStepIds?: string[];
  preparationSteps?: { id: string; goalMinutes: number }[];
};

export type ApiCategory = { id: string; name: string; translations?: unknown | null; menuIndex?: number | null };

export type ApiPrepStepDef = {
  id: string;
  name: string;
  goalMinutes: number;
  includeComments: boolean;
  includeModifiers: boolean;
  stationId: string | null;
  stationName: string | null;
};

export type ApiStationStep = {
  id: string;
  name: string;
  goalMinutes: number;
  includeComments: boolean;
  includeModifiers: boolean;
};

export type ApiStation = {
  id: string;
  name: string;
  /** Present on GET /stations; omitted in the products `lookup.stations`. */
  preparationSteps?: ApiStationStep[];
};

export type ProductsLookup = {
  categories: ApiCategory[];
  modifierGroups?: ApiModifierGroup[];
  preparationSteps?: ApiPrepStepDef[];
  stations?: ApiStation[];
};

export type ListProductsResponse = { products: ApiProduct[]; lookup: ProductsLookup };

async function authGet<T>(path: string, token: string, businessId?: string | null): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (businessId) headers["x-business-id"] = businessId;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers, credentials: "omit" });
  } catch {
    throw new ApiError(0, { error: "Network error" });
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new ApiError(res.status, (data && typeof data === "object" ? data : {}) as Record<string, unknown>);
  }
  return data as T;
}

/**
 * GET /products — full product catalog for the authenticated manager.
 * Returns `{ products, lookup }`; `lookup` carries categories, modifier groups,
 * preparation steps, and stations.
 */
export type UpdateCategoryBody = {
  /** Sort position of the section within its menu (integer >= 0, or null). */
  menuIndex?: number | null;
  /** Defaults to the business's default menu when omitted. */
  menuId?: string;
};

/**
 * PATCH /categories/:categoryId — update a section. Section reorder is persisted
 * by sending one call per section with its new `menuIndex` (there is no bulk
 * reorder endpoint).
 */
export function updateCategory(token: string, categoryId: string, body: UpdateCategoryBody, businessId?: string | null): Promise<ApiCategory> {
  return authJson<ApiCategory>("PATCH", `/categories/${encodeURIComponent(categoryId)}`, token, businessId, body);
}

export function listProducts(token: string, businessId?: string | null): Promise<ListProductsResponse> {
  return authGet<ListProductsResponse>("/products", token, businessId);
}

/** GET /stations — business kitchen stations (with their preparation steps). */
export function listStations(token: string, businessId?: string | null): Promise<ApiStation[]> {
  // Business context is sent via the `x-business-id` header (added by authGet).
  return authGet<{ items: ApiStation[] }>("/stations", token, businessId).then((r) => (Array.isArray(r?.items) ? r.items : []));
}

// ── Square integration (OAuth) ──────────────────────────────────────────────

export type SquareConnection = {
  id: string;
  businessId: string;
  merchantId: string | null;
  environment: string;
  scope: string | null;
  expiresAt: string | null;
  connectedAt: string;
  updatedAt: string;
};

export type SquareLocation = { id: string; name: string | null; status: string | null; timezone: string | null };

export type SquareConnectionStatus = {
  connected: boolean;
  connection: SquareConnection | null;
  locations: SquareLocation[];
};

/** GET /integrations/square/connection — current Square connection + locations. */
export function getSquareConnection(token: string, businessId?: string | null): Promise<SquareConnectionStatus> {
  return authGet<SquareConnectionStatus>("/integrations/square/connection", token, businessId);
}

/**
 * The Square OAuth redirect URI — must be publicly reachable (e.g. an ngrok
 * tunnel to the API) and registered in the Square app dashboard. Square sends
 * the browser here after consent; the API's `/integrations/square/oauth/exchange`
 * endpoint completes the token exchange server-side and redirects back.
 */
export function squareOAuthRedirectUri(): string {
  return process.env.NEXT_PUBLIC_SQUARE_REDIRECT_URI?.trim() || `${API_BASE_URL}/integrations/square/oauth/exchange`;
}

/**
 * GET /integrations/square/oauth/url — the Square authorization URL to redirect
 * the browser to. `redirectUri` must equal `squareOAuthRedirectUri()`; `state`
 * is a CSRF/session token the API uses to complete the exchange on return.
 */
export function getSquareOAuthUrl(token: string, redirectUri: string, state: string, businessId?: string | null): Promise<{ authorizationUrl: string; redirectUri: string; scope: string[] }> {
  const qs = `?redirectUri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  return authGet<{ authorizationUrl: string; redirectUri: string; scope: string[] }>(`/integrations/square/oauth/url${qs}`, token, businessId);
}

/** DELETE /integrations/square/connection — disconnect (revokes the Square token). */
export function disconnectSquare(token: string, businessId?: string | null): Promise<{ ok: boolean }> {
  return authJson<{ ok: boolean }>("DELETE", "/integrations/square/connection", token, businessId);
}

/** POST /integrations/square/menu-sync/publish-all — push the catalog/menus to Square. */
export function syncSquareMenus(token: string, businessId?: string | null): Promise<unknown> {
  return authJson<unknown>("POST", "/integrations/square/menu-sync/publish-all", token, businessId, {});
}

export type SquareSyncStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "SKIPPED";

/**
 * A background Square catalog-sync task. The API creates one when a product is
 * updated on a Square-connected business (see `updateProduct`). Poll
 * `getSquareCatalogSyncTask` until `isRunning` is false (terminal status:
 * SUCCESS, FAILED, or SKIPPED).
 */
export type SquareCatalogSyncTask = {
  id: string;
  productId?: string;
  taskType: string; // currently always "PRODUCT_UPDATE"
  status: SquareSyncStatus;
  isRunning?: boolean;
  attempts: number;
  availableAt: string | null;
  processingStartedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  requestPayload?: unknown;
  responsePayload?: unknown;
  createdAt: string;
  updatedAt: string;
};

/** GET /integrations/square/catalog-sync-tasks/:taskId — poll a single sync task. */
export function getSquareCatalogSyncTask(token: string, taskId: string, businessId?: string | null): Promise<{ task: SquareCatalogSyncTask }> {
  return authGet<{ task: SquareCatalogSyncTask }>(`/integrations/square/catalog-sync-tasks/${encodeURIComponent(taskId)}`, token, businessId);
}

/** GET /integrations/square/catalog-sync-tasks — recent sync tasks (optionally per product). */
export function listSquareCatalogSyncTasks(token: string, opts: { productId?: string; limit?: number } = {}, businessId?: string | null): Promise<{ tasks: SquareCatalogSyncTask[]; productId: string | null; limit: number }> {
  const params = new URLSearchParams();
  if (opts.productId) params.set("productId", opts.productId);
  if (opts.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return authGet<{ tasks: SquareCatalogSyncTask[]; productId: string | null; limit: number }>(`/integrations/square/catalog-sync-tasks${qs ? `?${qs}` : ""}`, token, businessId);
}

export type SquareWebhookRunStatus = "PROCESSING" | "SUCCESS" | "FAILED" | "IGNORED" | "DUPLICATE_SKIPPED";

/**
 * An inbound Square webhook run (one Square event, possibly retried across
 * attempts). `resultLabel` is a ready-to-render badge label; `payload` is the
 * best payload to preview (Square order object if available, else webhook body);
 * `attempts` is the total recorded delivery count.
 */
export type SquareWebhookRun = {
  id: string;
  eventId: string | null;
  eventType: string | null;
  squareOrderId: string | null;
  locationId: string | null;
  merchantId: string | null;
  squareOrderState: string | null;
  status: SquareWebhookRunStatus;
  action: string | null;
  reason: string | null;
  resultLabel: string;
  foodyOrderId: string | null;
  attempts: number;
  signatureVerified: boolean | null;
  firstReceivedAt: string;
  lastReceivedAt: string;
  processedAt: string | null;
  processingDurationMs: number | null;
  httpStatusCode: number | null;
  errorMessage: string | null;
  payload: unknown;
  webhookPayload: unknown;
  squareOrderPayload: unknown;
  responsePayload: unknown;
  createdAt: string;
  updatedAt: string;
};

/** One entry in a run's delivery log (`deliveryLog[]`). */
export type SquareWebhookDeliveryAttempt = {
  id: string;
  attemptNumber: number;
  status: SquareWebhookRunStatus;
  action: string | null;
  reason: string | null;
  message: string | null;
  receivedAt: string;
  finishedAt: string | null;
  processingDurationMs: number | null;
  httpStatusCode: number | null;
  signatureVerified: boolean | null;
  errorMessage: string | null;
  requestHeaders: unknown;
  payload: unknown;
  webhookPayload: unknown;
  squareOrderPayload: unknown;
  responsePayload: unknown;
  createdAt: string;
};

export type SquareWebhookRunDetail = SquareWebhookRun & {
  deliveryLog: SquareWebhookDeliveryAttempt[];
};

/** GET /integrations/square/webhook-runs — recent inbound Square webhook runs. */
export function listSquareWebhookRuns(token: string, opts: { eventType?: string; status?: SquareWebhookRunStatus; limit?: number } = {}, businessId?: string | null): Promise<{ runs: SquareWebhookRun[]; limit: number; eventType: string | null; status: SquareWebhookRunStatus | null }> {
  const params = new URLSearchParams();
  if (opts.eventType) params.set("eventType", opts.eventType);
  if (opts.status) params.set("status", opts.status);
  if (opts.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return authGet<{ runs: SquareWebhookRun[]; limit: number; eventType: string | null; status: SquareWebhookRunStatus | null }>(`/integrations/square/webhook-runs${qs ? `?${qs}` : ""}`, token, businessId);
}

/** GET /integrations/square/webhook-runs/:runId — one run with its full delivery log. */
export function getSquareWebhookRun(token: string, runId: string, businessId?: string | null): Promise<{ run: SquareWebhookRunDetail }> {
  return authGet<{ run: SquareWebhookRunDetail }>(`/integrations/square/webhook-runs/${encodeURIComponent(runId)}`, token, businessId);
}

export type DriverActivationEvent = {
  createdAt: string;
  status: string;
};

export type ApiDriver = {
  id: string;
  createdAt: string;
  name: string;
  /** Normalized phone, or null. */
  phone: string | null;
  /** True when the driver sent a location in the last 10 minutes. */
  active: boolean;
  activatedAt: string | null;
  deactivatedAt: string | null;
  /** Dispatch priority order (ascending). */
  priorityLevel: number;
  activationEvents: DriverActivationEvent[];
};

/** GET /drivers — full driver list, ordered by priorityLevel then createdAt. */
export function listDrivers(token: string, businessId?: string | null): Promise<ApiDriver[]> {
  return authGet<ApiDriver[]>("/drivers", token, businessId).then((r) => (Array.isArray(r) ? r : []));
}

export type CreatePreparationStepBody = {
  name: string;
  /** Integer >= 0 (defaults to 0). When set, the API syncs it across all steps in the station. */
  goalMinutes?: number;
  includeComments?: boolean;
  includeModifiers?: boolean;
};

/** POST /stations/:stationId/steps — create a preparation step in a station. */
export function createPreparationStep(token: string, stationId: string, body: CreatePreparationStepBody, businessId?: string | null): Promise<ApiStationStep> {
  return authJson<ApiStationStep>("POST", `/stations/${encodeURIComponent(stationId)}/steps`, token, businessId, body);
}

export type UpdatePreparationStepBody = {
  name?: string;
  /** Integer >= 0. When set, the API syncs it across all steps in the station. */
  goalMinutes?: number;
  includeComments?: boolean;
  includeModifiers?: boolean;
};

/** PATCH /stations/:stationId/steps/:stepId — partial update of a preparation step. */
export function updatePreparationStep(token: string, stationId: string, stepId: string, body: UpdatePreparationStepBody, businessId?: string | null): Promise<ApiStationStep> {
  return authJson<ApiStationStep>("PATCH", `/stations/${encodeURIComponent(stationId)}/steps/${encodeURIComponent(stepId)}`, token, businessId, body);
}

export type UpdateProductBody = {
  name?: string;
  visible?: boolean;
  alertDriver?: boolean;
  description?: string | null;
  price?: number | null;
  comparedAtPrice?: number | null;
  itemType?: "PRODUCT" | "COMBO";
  preparationStepIds?: string[];
  /**
   * Replaces the product's ENTIRE modifier-group list (there is no attach/detach
   * endpoint — send the full next array). Every id must already exist.
   */
  modifierGroupIds?: string[];
  translations?: Record<string, { title: string; description: string }>;
  /**
   * Product image list. Both fields REPLACE the entire current image list and
   * are mutually exclusive (sending both is rejected). `photoIds` references
   * existing file records; `photoUrls` attaches public http(s) URLs (a file
   * record is created automatically for URLs that don't exist yet).
   */
  photoIds?: string[];
  photoUrls?: string[];
  /**
   * `categoryId` sets the product's direct/primary category (null clears it).
   * `categoryIds` REPLACES the full multi-category link list — to remove one
   * category, send the categories you want to keep; `[]` detaches from all.
   */
  categoryId?: string | null;
  categoryIds?: string[];
  /**
   * Reorder within a category. Send with `categoryId`: `categoryIndex` is the
   * 1-based target position (null → move to end). The API reindexes the other
   * products in that category automatically.
   */
  categoryIndex?: number | null;
};

/**
 * Resolves a stored image *path* to a renderable public URL for the browser.
 * We store and send paths (e.g. `/api/bucket/<key>`); the file host is only
 * applied here, at render time, so the stored value stays host-independent.
 * Already-absolute URLs are returned unchanged.
 */
export function toAbsoluteImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${FILE_API_BASE_URL}${path}`;
  return `${FILE_API_BASE_URL}/${path}`;
}

/**
 * POST /bucket/upload — uploads a single image (multipart `file`) and returns
 * its storage key and the bucket proxy *path* (e.g. `/api/bucket/<key>`). We
 * persist the path, not a host-qualified URL; rendering prepends the file host.
 * Only images are supported by the bucket (jpeg/png/webp/gif/svg, ≤10MB).
 */
export async function uploadBucketImage(
  token: string,
  file: File,
  businessId?: string | null,
): Promise<{ key: string; url: string }> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (businessId) headers["x-business-id"] = businessId;
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/bucket/upload`, { method: "POST", headers, body: form, credentials: "omit" });
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
  const data = (await res.json()) as { key: string; url: string };
  // Return the raw proxy path — we persist the path, not a host-qualified URL.
  return { key: data.key, url: data.url };
}

/**
 * The updated product returned by `PATCH /products/:id`. `squareSyncTask` is a
 * background Square catalog-sync task (poll it with `getSquareCatalogSyncTask`)
 * when the business is Square-connected, or `null` when it is not.
 */
export type UpdatedProduct = ApiProduct & { squareSyncTask: SquareCatalogSyncTask | null };

/** PATCH /products/:productId — partial product update; returns the updated product. */
export async function updateProduct(token: string, productId: string, body: UpdateProductBody, businessId?: string | null): Promise<UpdatedProduct> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  if (businessId) headers["x-business-id"] = businessId;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`, { method: "PATCH", headers, body: JSON.stringify(body), credentials: "omit" });
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
  return (await res.json()) as UpdatedProduct;
}

/**
 * Authenticated JSON mutation (POST/PATCH/DELETE). Serializes `body` when given,
 * attaches the manager auth + business headers, and parses the JSON response
 * (returns `undefined` for empty bodies). Throws `ApiError` on non-2xx.
 */
async function authJson<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  token: string,
  businessId?: string | null,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (businessId) headers["x-business-id"] = businessId;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "omit",
    });
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
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as T;
  }
}

// ── Modifier groups & items ─────────────────────────────────────────────────
// `PATCH/POST /modifier-groups` mutate group *metadata* only; the options inside
// a group are managed separately through the `/modifier-group-items` endpoints.

export type ModifierGroupKind = "SINGLE" | "MULTI";

export type ModifierGroupResult = {
  id: string;
  title: string;
  required: boolean;
  type: ModifierGroupKind | null;
  minSelection: number | null;
  maxSelection: number | null;
  translations: Record<string, unknown> | null;
};

export type CreateModifierGroupBody = {
  id?: string;
  title: string;
  required?: boolean;
  type?: ModifierGroupKind | null;
  minSelection?: number | null;
  maxSelection?: number | null;
  translations?: Record<string, unknown> | null;
};

export type UpdateModifierGroupBody = {
  title?: string;
  required?: boolean;
  type?: ModifierGroupKind | null;
  minSelection?: number | null;
  maxSelection?: number | null;
  translations?: Record<string, unknown> | null;
};

export type ModifierGroupItemResult = {
  id: string;
  modifierGroupId: string | null;
  name: string;
  description: string | null;
  price: number;
  translations: Record<string, unknown> | null;
  photo: { id: string; url: string } | null;
  /**
   * Background Square sync task(s) created when the business is Square-connected.
   * `squareSyncTask` is the primary/simple entry; `squareSyncTasks` is the full
   * list — one modifier update can fan out across multiple Square menus. Both are
   * empty/null when there is no Square connection. Poll each with
   * `getSquareCatalogSyncTask`.
   */
  squareSyncTask?: SquareCatalogSyncTask | null;
  squareSyncTasks?: SquareCatalogSyncTask[];
};

export type CreateModifierGroupItemBody = {
  id?: string;
  modifierGroupId: string;
  name: string;
  description?: string | null;
  /** Integer cents, >= 0. */
  price: number;
  translations?: Record<string, unknown> | null;
  fileId?: string | null;
};

export type UpdateModifierGroupItemBody = {
  name?: string;
  description?: string | null;
  /** Integer cents, >= 0. */
  price?: number;
  translations?: Record<string, unknown> | null;
  modifierGroupId?: string | null;
  /** Attach an existing file record. Mutually exclusive with `photoUrl`. */
  fileId?: string | null;
  /** Attach a public http(s) image URL (a file record is created if needed). */
  photoUrl?: string | null;
};

/** POST /modifier-groups — create a group (metadata only; add items separately). */
export function createModifierGroup(token: string, body: CreateModifierGroupBody, businessId?: string | null): Promise<ModifierGroupResult> {
  return authJson<ModifierGroupResult>("POST", "/modifier-groups", token, businessId, body);
}

/** PATCH /modifier-groups/:id — update group metadata (not its items). */
export function updateModifierGroup(token: string, groupId: string, body: UpdateModifierGroupBody, businessId?: string | null): Promise<ModifierGroupResult> {
  return authJson<ModifierGroupResult>("PATCH", `/modifier-groups/${encodeURIComponent(groupId)}`, token, businessId, body);
}

/** DELETE /modifier-groups/:id */
export function deleteModifierGroup(token: string, groupId: string, businessId?: string | null): Promise<{ id: string; deleted: boolean }> {
  return authJson<{ id: string; deleted: boolean }>("DELETE", `/modifier-groups/${encodeURIComponent(groupId)}`, token, businessId);
}

/** POST /modifier-group-items — add an option to a group. */
export function createModifierGroupItem(token: string, body: CreateModifierGroupItemBody, businessId?: string | null): Promise<ModifierGroupItemResult> {
  return authJson<ModifierGroupItemResult>("POST", "/modifier-group-items", token, businessId, body);
}

/** PATCH /modifier-group-items/:itemId — edit an option. */
export function updateModifierGroupItem(token: string, itemId: string, body: UpdateModifierGroupItemBody, businessId?: string | null): Promise<ModifierGroupItemResult> {
  return authJson<ModifierGroupItemResult>("PATCH", `/modifier-group-items/${encodeURIComponent(itemId)}`, token, businessId, body);
}

/** DELETE /modifier-group-items/:itemId — remove an option. */
export function deleteModifierGroupItem(token: string, itemId: string, businessId?: string | null): Promise<{ id: string; deleted: boolean }> {
  return authJson<{ id: string; deleted: boolean }>("DELETE", `/modifier-group-items/${encodeURIComponent(itemId)}`, token, businessId);
}

export type BarChartBucket = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  value: number;
  compareValue?: number | null;
  delta?: number | null;
  deltaPercentage?: number | null;
};

/** Shared bar-chart analytics shape (order-quantity uses counts; revenue uses cents). */
export type BarChartAnalytics = {
  metric: string;
  chartType: "bar";
  granularity: string;
  timezone: string;
  range: { startDate: string; endDate: string };
  comparison?: {
    startDate: string;
    endDate: string;
    total: number;
    delta: number;
    deltaPercentage: number | null;
  };
  summary: { total: number; averagePerBucket: number; maxBucketValue: number };
  buckets: BarChartBucket[];
};

export type BarChartParams = {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  timezone?: string;
  businessId?: string | null;
};

function barChartQuery(params: BarChartParams): string {
  const qs = new URLSearchParams();
  qs.set("startDate", params.startDate);
  qs.set("endDate", params.endDate);
  if (params.compareStartDate) qs.set("compareStartDate", params.compareStartDate);
  if (params.timezone) qs.set("timezone", params.timezone);
  return qs.toString();
}

/** GET /v1/analytics/order-quantity — bar-chart-ready order counts by day. */
export function getOrderQuantity(token: string, params: BarChartParams): Promise<BarChartAnalytics> {
  return authGet<BarChartAnalytics>(`/v1/analytics/order-quantity?${barChartQuery(params)}`, token, params.businessId);
}

/** GET /v1/analytics/revenue — bar-chart-ready daily revenue (in cents) by day. */
export function getRevenue(token: string, params: BarChartParams): Promise<BarChartAnalytics> {
  return authGet<BarChartAnalytics>(`/v1/analytics/revenue?${barChartQuery(params)}`, token, params.businessId);
}

/** GET /v1/analytics/new-customers — bar-chart-ready daily new-customer counts by day. */
export function getNewCustomers(token: string, params: BarChartParams): Promise<BarChartAnalytics> {
  return authGet<BarChartAnalytics>(`/v1/analytics/new-customers?${barChartQuery(params)}`, token, params.businessId);
}

/** GET /v1/analytics/average-ticket — bar-chart-ready daily average ticket (in cents) by day. */
export function getAverageTicket(token: string, params: BarChartParams): Promise<BarChartAnalytics> {
  return authGet<BarChartAnalytics>(`/v1/analytics/average-ticket?${barChartQuery(params)}`, token, params.businessId);
}

export type FeedbackScoreCounts = { good: number; medium: number; bad: number };

export type FeedbackScorePoint = {
  date: string;
  label: string;
  value: number | null;
  compareValue?: number | null;
  delta?: number | null;
  deltaPercentage?: number | null;
};

export type FeedbackScore = {
  id: string;
  createdAt: string;
  orderId: string;
  orderNumber: string | null;
  orderStatus: string | null;
  orderType: string | null;
  customerName: string | null;
  customerPhone: string | null;
  language: string | null;
  score: number;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  productQuality: number | null;
  temperature: number | null;
  deliverySpeed: number | null;
  serviceExperience: number | null;
  comment: string | null;
  reward: { id: string; title: string; status: string; quantity: number | null; productId: string | null; productName: string | null } | null;
};

export type FeedbackAnalytics = {
  metric: "feedback";
  chartType: "line";
  timezone: string;
  range: { startDate: string; endDate: string };
  comparison?: {
    startDate: string;
    endDate: string;
    quantityOfFeedback: number;
    quantityOfFeedbackDelta: number;
    quantityOfFeedbackDeltaPercentage: number | null;
    averageScore: number | null;
    averageScoreDelta: number | null;
    averageScoreDeltaPercentage: number | null;
    scoreCounts: FeedbackScoreCounts;
  };
  summary: { quantityOfFeedback: number; averageScore: number | null; scoreCounts: FeedbackScoreCounts };
  averageScorePoints: FeedbackScorePoint[];
  scores: FeedbackScore[];
};

/** GET /v1/feedback — feedback analytics (stats, daily score trend, rating buckets, reviews). */
export function getFeedback(token: string, params: BarChartParams): Promise<FeedbackAnalytics> {
  return authGet<FeedbackAnalytics>(`/v1/feedback?${barChartQuery(params)}`, token, params.businessId);
}

export type RetentionOrderBucket = {
  key: string;
  label: string;
  customerCount: number;
  compareCustomerCount?: number | null;
  delta?: number | null;
  deltaPercentage?: number | null;
};

export type RetentionDayPoint = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  newCustomerCount: number;
  returningCustomerCount: number;
  totalCustomerCount: number;
  newCustomerShare: number | null;
  returningCustomerShare: number | null;
  compareNewCustomerCount?: number | null;
  compareReturningCustomerCount?: number | null;
  compareTotalCustomerCount?: number | null;
  compareNewCustomerShare?: number | null;
  compareReturningCustomerShare?: number | null;
};

export type CustomerRetentionAnalytics = {
  metric: "customerRetention";
  chartType: "mixed";
  timezone: string;
  range: { startDate: string; endDate: string };
  comparison?: { startDate: string; endDate: string; activeCustomerCount: number };
  summary: { activeCustomerCount: number; wonCustomers: number | null; lostCustomers: number | null };
  orderQuantityBuckets: RetentionOrderBucket[];
  newVsReturningPerDay: RetentionDayPoint[];
};

/** GET /v1/analytics/customer-retention — active/won/lost, order-frequency cohorts, new-vs-returning. */
export function getCustomerRetention(token: string, params: BarChartParams): Promise<CustomerRetentionAnalytics> {
  return authGet<CustomerRetentionAnalytics>(`/v1/analytics/customer-retention?${barChartQuery(params)}`, token, params.businessId);
}

/** GET /businesses — owned businesses for the authenticated manager. */
export async function listBusinesses(token: string): Promise<ListBusinessesResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/businesses`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "omit",
    });
  } catch {
    throw new ApiError(0, { error: "Network error" });
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as unknown as ListBusinessesResult;
}
