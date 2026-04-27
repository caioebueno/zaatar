import 'dotenv/config'
import http from "node:http";
import cron from "node-cron";
import axios from "axios";
import { Pool } from "pg";
import { processDispatchAssignmentJobs as runDispatchAssignmentJobs } from "./dispatchAssignment.js";

const PORT = Number(process.env.PORT || 4000);
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 0 * * *";
const PROCESS_ON_START = process.env.PROCESS_ON_START === "true";
const JOBS_PER_RUN = Number(process.env.JOBS_PER_RUN || 10);
const RUN_TRIGGER_SECRET = process.env.RUN_TRIGGER_SECRET?.trim();
const EXTERNAL_ORDER_SCAN_ENABLED =
  process.env.EXTERNAL_ORDER_SCAN_ENABLED === "true";
const EXTERNAL_ORDER_SCAN_SCHEDULE =
  process.env.EXTERNAL_ORDER_SCAN_SCHEDULE || "* * * * *";
const EXTERNAL_ORDER_SCAN_ON_START =
  process.env.EXTERNAL_ORDER_SCAN_ON_START === "true";
const DEFAULT_EXTERNAL_ORDER_API_URL =
  "https://api.olaclick.app/ms-orders/auth/orders?filter[service_types]=TAKEAWAY,DELIVERY,ONSITE&filter[status]=PENDING,PREPARING,READY,DELIVERED&filter[max_order_limit]=false&include_pending_and_ongoing=true&per_page=25&page=1";
const EXTERNAL_ORDER_API_URL =
  process.env.EXTERNAL_ORDER_API_URL?.trim() || DEFAULT_EXTERNAL_ORDER_API_URL;
const EXTERNAL_ORDER_API_COMPANY_TOKEN =
  process.env.EXTERNAL_ORDER_API_COMPANY_TOKEN?.trim() || "delicias-da-vovo-7";
const EXTERNAL_ORDER_API_COOKIE = process.env.EXTERNAL_ORDER_API_COOKIE?.trim();
const EXTERNAL_ORDER_API_AUTHORIZATION =
  process.env.EXTERNAL_ORDER_API_AUTHORIZATION?.trim();
const EXTERNAL_ORDER_API_HEADERS_JSON =
  process.env.EXTERNAL_ORDER_API_HEADERS_JSON?.trim();
const ORDER_IMPORT_API_URL = process.env.ORDER_IMPORT_API_URL?.trim();
const ORDER_IMPORT_API_SECRET = process.env.ORDER_IMPORT_API_SECRET?.trim();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let isProcessing = false;
let isScanningExternalOrders = false;
let hasInitializedExternalOrderBaseline = false;
let knownExternalOrderIds = new Set();
let lastExternalOrderScanAt = null;
let lastExternalOrderScanStatus = "idle";
let lastExternalOrderNewCount = 0;
let lastExternalOrderImportAt = null;
let lastExternalOrderImportStatus = "idle";
let lastExternalOrderImportCreatedCount = 0;

function buildExternalOrderRequestHeaders() {
  const headers = {
    accept: "application/json,multipart/form-data",
    "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    origin: "https://panel.olaclick.app",
    priority: "u=1, i",
    "app-company-token": "delicias-da-vovo-7",
    // referer: "https://panel.olaclick.app/",
    // "sec-ch-ua": '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
    // "sec-ch-ua-mobile": "?0",
    // "sec-ch-ua-platform": '"macOS"',
    // "sec-fetch-dest": "empty",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "same-site",
    // "user-agent":
      // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "content-type": "application/json",
  };

  if (EXTERNAL_ORDER_API_COMPANY_TOKEN) {
    headers["app-company-token"] = EXTERNAL_ORDER_API_COMPANY_TOKEN;
  }

  if (EXTERNAL_ORDER_API_COOKIE) {
    headers.Cookie = EXTERNAL_ORDER_API_COOKIE;
  }

  if (EXTERNAL_ORDER_API_AUTHORIZATION) {
    headers.Authorization = EXTERNAL_ORDER_API_AUTHORIZATION;
  }

  if (EXTERNAL_ORDER_API_HEADERS_JSON) {
    try {
      const parsedHeaders = JSON.parse(EXTERNAL_ORDER_API_HEADERS_JSON);
      if (parsedHeaders && typeof parsedHeaders === "object") {
        for (const [key, value] of Object.entries(parsedHeaders)) {
          if (typeof value === "string" && value.trim()) {
            headers[key] = value;
          }
        }
      }
    } catch (error) {
      console.error(
        "[queue-worker] Failed to parse EXTERNAL_ORDER_API_HEADERS_JSON:",
        error,
      );
    }
  }

  return headers;
}

function extractOrdersArrayFromPayload(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const directArrayKeys = [
    "orders",
    "data",
    "items",
    "results",
    "docs",
    "rows",
  ];

  for (const key of directArrayKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  for (const key of ["data", "payload", "result", "response"]) {
    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === "object") {
      const nestedOrders = extractOrdersArrayFromPayload(nestedValue);
      if (nestedOrders.length > 0) {
        return nestedOrders;
      }
    }
  }

  return [];
}

function normalizeExternalOrderId(order) {
  if (!order || typeof order !== "object") {
    return null;
  }

  const candidateFields = [
    order.public_id,
    order.id,
    order.uuid,
    order.orderId,
    order.order_id,
    order.externalId,
    order.external_id,
    order.number,
    order.code,
  ];

  for (const candidate of candidateFields) {
    if (
      (typeof candidate === "string" && candidate.trim()) ||
      typeof candidate === "number"
    ) {
      return String(candidate).trim();
    }
  }

  return null;
}

async function getExistingOrderExternalIds(externalIds) {
  if (!Array.isArray(externalIds) || externalIds.length === 0) {
    return new Set();
  }

  const dedupedExternalIds = Array.from(
    new Set(
      externalIds
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (dedupedExternalIds.length === 0) {
    return new Set();
  }

  const { rows } = await pool.query(
    `
      SELECT "externalId"
      FROM "Order"
      WHERE "externalId" IS NOT NULL
        AND "externalId" = ANY($1::text[])
    `,
    [dedupedExternalIds],
  );

  return new Set(
    rows
      .map((row) =>
        typeof row.externalId === "string" ? row.externalId.trim() : "",
      )
      .filter(Boolean),
  );
}

async function scanExternalOrders() {
  if (!EXTERNAL_ORDER_SCAN_ENABLED) {
    return;
  }

  if (!EXTERNAL_ORDER_API_URL) {
    if (lastExternalOrderScanStatus !== "misconfigured") {
      console.error(
        "[queue-worker] External order scan is enabled but EXTERNAL_ORDER_API_URL is missing.",
      );
    }
    lastExternalOrderScanStatus = "misconfigured";
    return;
  }

  if (isScanningExternalOrders) {
    console.log(
      "[queue-worker] Skipping external order scan because previous scan is still running.",
    );
    return;
  }

  isScanningExternalOrders = true;
  lastExternalOrderScanAt = new Date().toISOString();
  lastExternalOrderNewCount = 0;

  try {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: EXTERNAL_ORDER_API_URL,
      headers: buildExternalOrderRequestHeaders(),
    };

    const response = await axios.request(config);
    const payload = response.data;
    console.log(payload.data?.length);
    const orders = extractOrdersArrayFromPayload(payload);
    const ordersWithExternalId = [];
    const scannedIds = [];

    for (const order of orders) {
      const normalizedExternalId = normalizeExternalOrderId(order);
      if (!normalizedExternalId) continue;
      scannedIds.push(normalizedExternalId);
      ordersWithExternalId.push({
        order,
        externalId: normalizedExternalId,
      });
    }

    const existingExternalIds = await getExistingOrderExternalIds(scannedIds);
    const ordersToImport = ordersWithExternalId
      .filter(({ externalId }) => !existingExternalIds.has(externalId))
      .map(({ order }) => order);
    const ordersToImportExternalIds = ordersWithExternalId
      .filter(({ externalId }) => !existingExternalIds.has(externalId))
      .map(({ externalId }) => externalId);

    if (ORDER_IMPORT_API_URL && ordersToImport.length > 0) {
      const importHeaders = {
        "Content-Type": "application/json",
      };

      if (ORDER_IMPORT_API_SECRET) {
        importHeaders.Authorization = `Bearer ${ORDER_IMPORT_API_SECRET}`;
      }

      lastExternalOrderImportAt = new Date().toISOString();

      const importResponse = await fetch(ORDER_IMPORT_API_URL, {
        method: "POST",
        headers: importHeaders,
        body: JSON.stringify({ data: ordersToImport }),
      });

      if (!importResponse.ok) {
        const importErrorBody = await importResponse.json().catch(() => "");
        throw new Error(
          `ORDER_IMPORT_FAILED status=${importResponse.status} body=${importErrorBody}`,
        );
      }

      const importResult = await importResponse.json().catch(() => ({}));
      lastExternalOrderImportStatus = "ok";
      lastExternalOrderImportCreatedCount =
        typeof importResult?.created === "number" ? importResult.created : 0;
      const skippedInvalidCount =
        typeof importResult?.skippedInvalid === "number"
          ? importResult.skippedInvalid
          : 0;
      const skippedExistingCount =
        typeof importResult?.skippedExisting === "number"
          ? importResult.skippedExisting
          : 0;
      const queueRunError =
        typeof importResult?.queueRunError === "string"
          ? importResult.queueRunError
          : null;

      console.log(
        `[queue-worker] External order import completed. sent=${ordersToImport.length} created=${lastExternalOrderImportCreatedCount} skippedExisting=${skippedExistingCount} skippedInvalid=${skippedInvalidCount}`,
      );

      if (queueRunError) {
        console.warn(
          `[queue-worker] External order import queue run warning: ${queueRunError}`,
        );
      }
    } else if (!ORDER_IMPORT_API_URL) {
      lastExternalOrderImportStatus = "disabled";
    } else {
      lastExternalOrderImportStatus = "ok";
      lastExternalOrderImportCreatedCount = 0;
      console.log(
        `[queue-worker] External order import skipped. All scanned orders already exist by externalId.`,
      );
    }

    if (!hasInitializedExternalOrderBaseline) {
      knownExternalOrderIds = new Set(scannedIds);
      hasInitializedExternalOrderBaseline = true;
      lastExternalOrderScanStatus = "ok";
      console.log(
        `[queue-worker] External order baseline initialized with ${scannedIds.length} orders.`,
      );
      return;
    }

    const newOrderIds = ordersToImportExternalIds.filter(
      (id) => !knownExternalOrderIds.has(id),
    );
    for (const id of scannedIds) {
      knownExternalOrderIds.add(id);
    }

    lastExternalOrderNewCount = newOrderIds.length;
    lastExternalOrderScanStatus = "ok";

    if (newOrderIds.length > 0) {
      console.log(
        `[queue-worker] Detected ${newOrderIds.length} new external orders: ${newOrderIds.join(", ")}`,
      );
    } else {
      console.log(
        `[queue-worker] External order scan complete. No new orders found. Total known: ${knownExternalOrderIds.size}`,
      );
    }
  } catch (error) {
    lastExternalOrderScanStatus = "error";
    lastExternalOrderImportStatus = "error";
    console.error("[queue-worker] External order scan error:", error);
  } finally {
    isScanningExternalOrders = false;
  }
}

function getValidatedJobsPerRun() {
  if (!Number.isInteger(JOBS_PER_RUN) || JOBS_PER_RUN < 1) {
    throw new Error(
      `Invalid JOBS_PER_RUN "${process.env.JOBS_PER_RUN}". Expected a positive integer.`,
    );
  }

  return JOBS_PER_RUN;
}

function normalizeRunLimit(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.floor(value);
    if (parsed > 0) return parsed;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

async function processDispatchAssignmentJobs(limitOverride) {
  if (isProcessing) {
    console.log("[queue-worker] Skipping run because a previous run is still active.");
    return;
  }

  isProcessing = true;

  try {
    const defaultJobsPerRun = getValidatedJobsPerRun();
    const normalizedOverrideLimit = normalizeRunLimit(limitOverride);
    const jobsPerRun = normalizedOverrideLimit || defaultJobsPerRun;

    console.log(
      `[queue-worker] Triggering queue processing at ${new Date().toISOString()} with limit=${jobsPerRun}`,
    );

    const result = await runDispatchAssignmentJobs(jobsPerRun);

    console.log("[queue-worker] Queue processing completed:", result);
  } catch (error) {
    console.error("[queue-worker] Queue processing error:", error);
  } finally {
    isProcessing = false;
  }
}

function handleRequest(request, response) {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        ok: true,
        service: "dispatch-queue-worker",
        schedule: CRON_SCHEDULE,
        jobsPerRun: JOBS_PER_RUN,
        externalOrderScan: {
          enabled: EXTERNAL_ORDER_SCAN_ENABLED,
          schedule: EXTERNAL_ORDER_SCAN_SCHEDULE,
          configured: Boolean(EXTERNAL_ORDER_API_URL),
          baselineInitialized: hasInitializedExternalOrderBaseline,
          knownOrders: knownExternalOrderIds.size,
          lastScanAt: lastExternalOrderScanAt,
          lastScanStatus: lastExternalOrderScanStatus,
          lastNewOrderCount: lastExternalOrderNewCount,
          importApiConfigured: Boolean(ORDER_IMPORT_API_URL),
          lastImportAt: lastExternalOrderImportAt,
          lastImportStatus: lastExternalOrderImportStatus,
          lastImportCreatedCount: lastExternalOrderImportCreatedCount,
        },
      }),
    );
    return;
  }

  if (request.method === "POST" && request.url === "/run") {
    if (RUN_TRIGGER_SECRET) {
      const authorizationHeader = request.headers.authorization;
      const isAuthorized =
        authorizationHeader === `Bearer ${RUN_TRIGGER_SECRET}`;

      if (!isAuthorized) {
        response.writeHead(401, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }
    }

    readJsonBody(request)
      .then((payload) => {
        const runLimit =
          payload && typeof payload === "object" && payload !== null
            ? normalizeRunLimit(payload.limit)
            : undefined;
        return processDispatchAssignmentJobs(runLimit);
      })
      .finally(() => {
      response.writeHead(202, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ accepted: true }));
      });
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      service: "dispatch-queue-worker",
      endpoints: ["/health", "/run (POST)"],
    }),
  );
}

function startServer() {
  const server = http.createServer(handleRequest);

  server.listen(PORT, () => {
    console.log(
      `[queue-worker] Server listening on port ${PORT} (${new Date().toISOString()})`,
    );
  });
}

function startCron() {
  if (!cron.validate(CRON_SCHEDULE)) {
    throw new Error(`Invalid CRON_SCHEDULE: "${CRON_SCHEDULE}"`);
  }

  cron.schedule(CRON_SCHEDULE, () => {
    void processDispatchAssignmentJobs();
  });

  console.log(`[queue-worker] Cron scheduled: ${CRON_SCHEDULE}`);
}

function startExternalOrderScanCron() {
  if (!EXTERNAL_ORDER_SCAN_ENABLED) {
    console.log("[queue-worker] External order scan disabled.");
    return;
  }

  if (!cron.validate(EXTERNAL_ORDER_SCAN_SCHEDULE)) {
    throw new Error(
      `Invalid EXTERNAL_ORDER_SCAN_SCHEDULE: "${EXTERNAL_ORDER_SCAN_SCHEDULE}"`,
    );
  }

  cron.schedule(EXTERNAL_ORDER_SCAN_SCHEDULE, () => {
    void scanExternalOrders();
  });

  console.log(
    `[queue-worker] External order scan cron scheduled: ${EXTERNAL_ORDER_SCAN_SCHEDULE}`,
  );
}

try {
  getValidatedJobsPerRun();
  startServer();
  startCron();
  startExternalOrderScanCron();

  if (PROCESS_ON_START) {
    void processDispatchAssignmentJobs();
  }

  if (EXTERNAL_ORDER_SCAN_ENABLED && EXTERNAL_ORDER_SCAN_ON_START) {
    void scanExternalOrders();
  }
} catch (error) {
  console.error("[queue-worker] Fatal startup error:", error);
  process.exit(1);
}
