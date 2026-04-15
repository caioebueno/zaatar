import http from "node:http";
import cron from "node-cron";

const PORT = Number(process.env.PORT || 4000);
const TARGET_BASE_URL = process.env.TARGET_BASE_URL;
const TARGET_PATH =
  process.env.TARGET_PATH || "/api/internal/dispatch-assignment-jobs/process";
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 0 * * *";
const CRON_SECRET = process.env.CRON_SECRET;
const PROCESS_ON_START = process.env.PROCESS_ON_START === "true";
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 60000);

let isProcessing = false;

function getTargetUrl() {
  if (!TARGET_BASE_URL) {
    throw new Error("Missing TARGET_BASE_URL environment variable");
  }

  const baseUrl = TARGET_BASE_URL.endsWith("/")
    ? TARGET_BASE_URL.slice(0, -1)
    : TARGET_BASE_URL;
  const path = TARGET_PATH.startsWith("/") ? TARGET_PATH : `/${TARGET_PATH}`;

  return `${baseUrl}${path}`;
}

async function processDispatchAssignmentJobs() {
  if (isProcessing) {
    console.log("[queue-worker] Skipping run because a previous run is still active.");
    return;
  }

  isProcessing = true;

  try {
    const targetUrl = getTargetUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    console.log(
      `[queue-worker] Triggering queue processing at ${new Date().toISOString()} -> ${targetUrl}`,
    );

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        ...(CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawBody = await response.text();
    let parsedBody = rawBody;

    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      // Non-JSON body; keep as text.
    }

    if (!response.ok) {
      console.error("[queue-worker] Queue processing failed:", {
        status: response.status,
        body: parsedBody,
      });
      return;
    }

    console.log("[queue-worker] Queue processing completed:", parsedBody);
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
        targetPath: TARGET_PATH,
      }),
    );
    return;
  }

  if (request.method === "POST" && request.url === "/run") {
    processDispatchAssignmentJobs().finally(() => {
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

try {
  getTargetUrl();
  startServer();
  startCron();

  if (PROCESS_ON_START) {
    void processDispatchAssignmentJobs();
  }
} catch (error) {
  console.error("[queue-worker] Fatal startup error:", error);
  process.exit(1);
}
