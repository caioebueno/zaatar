import { Pool } from "pg";
import { refreshRouteMetrics } from "./dispatchAssignment.js";

const DEFAULT_MAX_JOBS_PER_RUN = 10;

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function toErrorMessage(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown dispatch route metrics refresh error";
  }
}

function getRetryDate(attempts) {
  const delayInSeconds = Math.min(30 * 2 ** Math.max(attempts - 1, 0), 15 * 60);
  return new Date(Date.now() + delayInSeconds * 1000);
}

async function withTransaction(fn) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function claimDispatchRouteMetricsRefreshJobs(limit) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `
        WITH candidate_jobs AS (
          SELECT "id"
          FROM "DispatchRouteMetricsRefreshJob"
          WHERE "status" IN ('PENDING', 'FAILED')
            AND "availableAt" <= NOW()
          ORDER BY "createdAt" ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "DispatchRouteMetricsRefreshJob" job
        SET
          "status" = 'PROCESSING',
          "attempts" = job."attempts" + 1,
          "processingStartedAt" = NOW(),
          "updatedAt" = NOW()
        FROM candidate_jobs
        WHERE job."id" = candidate_jobs."id"
        RETURNING
          job."id",
          job."dispatchId",
          job."attempts"
      `,
      [limit],
    );

    return rows;
  });
}

async function markDispatchRouteMetricsRefreshJobCompleted(jobId) {
  await pool.query(
    `
      UPDATE "DispatchRouteMetricsRefreshJob"
      SET
        "status" = 'COMPLETED',
        "completedAt" = NOW(),
        "lastError" = NULL,
        "updatedAt" = NOW()
      WHERE "id" = $1
    `,
    [jobId],
  );
}

async function markDispatchRouteMetricsRefreshJobFailed(jobId, attempts, error) {
  await pool.query(
    `
      UPDATE "DispatchRouteMetricsRefreshJob"
      SET
        "status" = 'FAILED',
        "availableAt" = $2,
        "lastError" = $3,
        "updatedAt" = NOW()
      WHERE "id" = $1
    `,
    [jobId, getRetryDate(attempts), toErrorMessage(error)],
  );
}

export async function processDispatchRouteMetricsRefreshJobs(
  limit = DEFAULT_MAX_JOBS_PER_RUN,
) {
  const normalizedLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_MAX_JOBS_PER_RUN;

  let jobs;
  try {
    jobs = await claimDispatchRouteMetricsRefreshJobs(normalizedLimit);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "42P01") {
      console.warn(
        '[queue-worker] Skipping dispatch route metrics queue: table "DispatchRouteMetricsRefreshJob" does not exist yet. Apply latest schema changes.',
      );
      return { failed: 0, processed: 0, skipped: true };
    }
    throw error;
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await refreshRouteMetrics(job.dispatchId);
      await markDispatchRouteMetricsRefreshJobCompleted(job.id);
      processed += 1;
    } catch (error) {
      await markDispatchRouteMetricsRefreshJobFailed(job.id, job.attempts, error);
      failed += 1;
    }
  }

  return { failed, processed };
}
