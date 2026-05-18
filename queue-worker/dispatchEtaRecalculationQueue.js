import { Pool } from "pg";

const DEFAULT_MAX_JOBS_PER_RUN = 10;
const DEFAULT_BRANCH_COORDINATES = {
  lat: Number(process.env.DISPATCH_STORE_LAT || 28.34883080351401),
  lng: Number(process.env.DISPATCH_STORE_LNG || -81.65145586075074),
};
const FALLBACK_SPEED_METERS_PER_SECOND = Number(
  process.env.ETA_FALLBACK_SPEED_METERS_PER_SECOND || 8.33,
);

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function toErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown dispatch ETA recalculation error";
  }
}

function getRetryDate(attempts) {
  const delayInSeconds = Math.min(30 * 2 ** Math.max(attempts - 1, 0), 10 * 60);
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

async function claimDispatchEtaJobs(limit) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `
        WITH candidate_jobs AS (
          SELECT "id"
          FROM "DispatchEtaRecalculationJob"
          WHERE "status" IN ('PENDING', 'FAILED')
            AND "availableAt" <= NOW()
          ORDER BY "createdAt" ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "DispatchEtaRecalculationJob" job
        SET
          "status" = 'PROCESSING',
          "attempts" = job."attempts" + 1,
          "processingStartedAt" = NOW()
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

async function markDispatchEtaJobCompleted(jobId) {
  await pool.query(
    `
      UPDATE "DispatchEtaRecalculationJob"
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

async function markDispatchEtaJobFailed(jobId, attempts, error) {
  await pool.query(
    `
      UPDATE "DispatchEtaRecalculationJob"
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

function parseCoordinates(row, label) {
  const lat = Number(row.lat);
  const lng = Number(row.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`Invalid coordinates for ${label}`);
  }

  return { lat, lng };
}

function haversineMeters(origin, destination) {
  const earthRadiusMeters = 6371_000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latDistance = toRadians(destination.lat - origin.lat);
  const lngDistance = toRadians(destination.lng - origin.lng);
  const normalizedLat1 = toRadians(origin.lat);
  const normalizedLat2 = toRadians(destination.lat);

  const value =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(normalizedLat1) *
      Math.cos(normalizedLat2) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  const arc = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return earthRadiusMeters * arc;
}

async function getRouteDurationInMinutes(origin, destination) {
  const accessToken = process.env.MAPBOX_API?.trim();

  if (!accessToken) {
    const distance = haversineMeters(origin, destination);
    const durationSeconds = distance / Math.max(FALLBACK_SPEED_METERS_PER_SECOND, 1);
    return durationSeconds / 60;
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    alternatives: "false",
    geometries: "geojson",
    overview: "false",
    steps: "false",
  });

  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch route duration from Mapbox");
  }

  const data = await response.json();
  const durationInSeconds = data?.routes?.[0]?.duration;

  if (typeof durationInSeconds !== "number") {
    throw new Error("Mapbox did not return a route duration");
  }

  return durationInSeconds / 60;
}

async function getLatestDriverCoordinates(dispatchId) {
  const { rows } = await pool.query(
    `
      SELECT
        point."lat",
        point."lng",
        point."recordedAt"
      FROM "DispatchRouteSession" session
      INNER JOIN "DispatchRoutePoint" point
        ON point."sessionId" = session."id"
      WHERE session."dispatchId" = $1
      ORDER BY point."recordedAt" DESC, point."sequence" DESC
      LIMIT 1
    `,
    [dispatchId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    ...parseCoordinates(row, "driver"),
    recordedAt: row.recordedAt,
  };
}

async function getPendingDeliveryOrders(dispatchId) {
  const { rows } = await pool.query(
    `
      SELECT
        order_row."id",
        order_row."deliveryAddressId",
        order_row."createdAt",
        order_row."dispatchOrderIndex",
        delivery_address."lat",
        delivery_address."lng"
      FROM "Order" order_row
      INNER JOIN "DeliveryAddress" delivery_address
        ON delivery_address."id" = order_row."deliveryAddressId"
      WHERE order_row."dispatchId" = $1
        AND order_row."deliveredAt" IS NULL
        AND order_row."canceled" = false
      ORDER BY
        order_row."dispatchOrderIndex" ASC NULLS LAST,
        order_row."createdAt" ASC
    `,
    [dispatchId],
  );

  return rows.map((row) => ({
    id: row.id,
    deliveryAddressId: row.deliveryAddressId,
    createdAt: row.createdAt,
    dispatchOrderIndex: row.dispatchOrderIndex,
    ...parseCoordinates(row, `order ${row.id}`),
  }));
}

async function calculateDurationsFromDriverPosition(dispatchId) {
  const driverCoordinates = await getLatestDriverCoordinates(dispatchId);
  const orders = await getPendingDeliveryOrders(dispatchId);

  if (!driverCoordinates || orders.length === 0) {
    return {
      durationToOrderId: new Map(),
      estimatedDeliveryDurationMinutes: 0,
      estimatedRoundTripDurationMinutes: 0,
    };
  }

  const durationToAddressId = new Map();
  const durationToOrderId = new Map();
  let currentCoordinates = {
    lat: driverCoordinates.lat,
    lng: driverCoordinates.lng,
  };
  let accumulatedDurationInMinutes = 0;

  for (const order of orders) {
    const existingDuration = durationToAddressId.get(order.deliveryAddressId);
    if (existingDuration !== undefined) {
      durationToOrderId.set(order.id, existingDuration);
      continue;
    }

    const durationToStop = await getRouteDurationInMinutes(currentCoordinates, {
      lat: order.lat,
      lng: order.lng,
    });
    accumulatedDurationInMinutes += durationToStop;

    const roundedDuration = Math.ceil(accumulatedDurationInMinutes);
    durationToAddressId.set(order.deliveryAddressId, roundedDuration);
    durationToOrderId.set(order.id, roundedDuration);
    currentCoordinates = {
      lat: order.lat,
      lng: order.lng,
    };
  }

  const returnDuration = await getRouteDurationInMinutes(
    currentCoordinates,
    DEFAULT_BRANCH_COORDINATES,
  );

  return {
    durationToOrderId,
    estimatedDeliveryDurationMinutes: Math.ceil(accumulatedDurationInMinutes),
    estimatedRoundTripDurationMinutes: Math.ceil(
      accumulatedDurationInMinutes + returnDuration,
    ),
  };
}

async function refreshDispatchEtaMetrics(dispatchId) {
  const {
    durationToOrderId,
    estimatedDeliveryDurationMinutes,
    estimatedRoundTripDurationMinutes,
  } = await calculateDurationsFromDriverPosition(dispatchId);

  await withTransaction(async (client) => {
    for (const [orderId, duration] of durationToOrderId.entries()) {
      await client.query(
        `
          UPDATE "Order"
          SET "estimatedDeliveryDurationMinutes" = $2
          WHERE "id" = $1
        `,
        [orderId, duration],
      );
    }

    await client.query(
      `
        UPDATE "Dispatch"
        SET
          "estimatedDeliveryDurationMinutes" = $2,
          "estimatedRoundTripDurationMinutes" = $3
        WHERE "id" = $1
      `,
      [
        dispatchId,
        estimatedDeliveryDurationMinutes,
        estimatedRoundTripDurationMinutes,
      ],
    );
  });

  return {
    estimatedDeliveryDurationMinutes,
    estimatedRoundTripDurationMinutes,
    ordersUpdated: durationToOrderId.size,
  };
}

export async function processDispatchEtaRecalculationJobs(
  limit = DEFAULT_MAX_JOBS_PER_RUN,
) {
  const normalizedLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_MAX_JOBS_PER_RUN;

  let jobs;
  try {
    jobs = await claimDispatchEtaJobs(normalizedLimit);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "42P01") {
      console.warn(
        '[queue-worker] Skipping dispatch ETA queue: table "DispatchEtaRecalculationJob" does not exist yet. Apply latest schema changes.',
      );
      return { processed: 0, failed: 0 };
    }
    throw error;
  }

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await refreshDispatchEtaMetrics(job.dispatchId);
      await markDispatchEtaJobCompleted(job.id);
      processed += 1;
    } catch (error) {
      await markDispatchEtaJobFailed(job.id, job.attempts, error);
      failed += 1;
    }
  }

  return { processed, failed };
}

