import 'dotenv/config'
import http from "node:http";
import cron from "node-cron";
import { processDispatchAssignmentJobs as runDispatchAssignmentJobs } from "./dispatchAssignment.js";

const PORT = Number(process.env.PORT || 4000);
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "0 0 * * *";
const PROCESS_ON_START = process.env.PROCESS_ON_START === "true";
const JOBS_PER_RUN = Number(process.env.JOBS_PER_RUN || 10);
const RUN_TRIGGER_SECRET = process.env.RUN_TRIGGER_SECRET?.trim();

let isProcessing = false;

function getValidatedJobsPerRun() {
  if (!Number.isInteger(JOBS_PER_RUN) || JOBS_PER_RUN < 1) {
    throw new Error(
      `Invalid JOBS_PER_RUN "${process.env.JOBS_PER_RUN}". Expected a positive integer.`,
    );
  }

  return JOBS_PER_RUN;
}

async function processDispatchAssignmentJobs() {
  if (isProcessing) {
    console.log("[queue-worker] Skipping run because a previous run is still active.");
    return;
  }

  isProcessing = true;

  try {
    const jobsPerRun = getValidatedJobsPerRun();

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
  getValidatedJobsPerRun();
  startServer();
  startCron();

  if (PROCESS_ON_START) {
    void processDispatchAssignmentJobs();
  }
} catch (error) {
  console.error("[queue-worker] Fatal startup error:", error);
  process.exit(1);
}
