import { randomUUID } from "node:crypto";
import { Pool } from "pg";

const DEFAULT_BRANCH_COORDINATES = {
  lat: 28.34883080351401,
  lng: -81.65145586075074,
};

const MAX_ROUTE_DURATION_IN_MINUTES = 10;
const DEFAULT_MAX_JOBS_PER_RUN = 10;

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
    return "Unknown dispatch assignment error";
  }
}

function getRetryDate(attempts) {
  const delayInSeconds = Math.min(30 * 2 ** Math.max(attempts - 1, 0), 15 * 60);
  return new Date(Date.now() + delayInSeconds * 1000);
}

function parseCoordinates(row) {
  const lat = Number(row.lat);
  const lng = Number(row.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid delivery address coordinates");
  }

  return { lat, lng };
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

async function getMapboxRouteDurationInMinutes(origin, destination) {
  const accessToken = process.env.MAPBOX_API;

  if (!accessToken) {
    throw new Error("Missing MAPBOX_API");
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

async function calculateOptimizedRoute(stops) {
  const uniqueStops = Array.from(
    new Map(stops.map((stop) => [stop.deliveryAddressId, stop])).values(),
  );

  if (uniqueStops.length === 0) {
    return {
      estimatedDeliveryDurationMinutes: 0,
      estimatedRoundTripDurationMinutes: 0,
      durationToStopByRouteKey: new Map(),
    };
  }

  const remainingStops = [...uniqueStops];
  const durationToStopByRouteKey = new Map();
  let currentCoordinates = DEFAULT_BRANCH_COORDINATES;
  let estimatedDeliveryDurationMinutes = 0;

  while (remainingStops.length > 0) {
    const candidates = await Promise.all(
      remainingStops.map(async (stop) => ({
        duration: await getMapboxRouteDurationInMinutes(
          currentCoordinates,
          parseCoordinates(stop),
        ),
        stop,
      })),
    );

    candidates.sort((left, right) => {
      if (left.duration !== right.duration) {
        return left.duration - right.duration;
      }

      return left.stop.createdAt.getTime() - right.stop.createdAt.getTime();
    });

    const nextStop = candidates[0];
    estimatedDeliveryDurationMinutes += nextStop.duration;

    durationToStopByRouteKey.set(
      nextStop.stop.routeKey,
      Math.ceil(estimatedDeliveryDurationMinutes),
    );

    currentCoordinates = parseCoordinates(nextStop.stop);

    const nextIndex = remainingStops.findIndex(
      (stop) => stop.routeKey === nextStop.stop.routeKey,
    );
    remainingStops.splice(nextIndex, 1);
  }

  const returnToStoreDurationMinutes = await getMapboxRouteDurationInMinutes(
    currentCoordinates,
    DEFAULT_BRANCH_COORDINATES,
  );

  return {
    estimatedDeliveryDurationMinutes: Math.ceil(estimatedDeliveryDurationMinutes),
    estimatedRoundTripDurationMinutes: Math.ceil(
      estimatedDeliveryDurationMinutes + returnToStoreDurationMinutes,
    ),
    durationToStopByRouteKey,
  };
}

async function calculateDispatchOrderDeliveryMetricsByPosition(orders) {
  if (orders.length === 0) {
    return {
      estimatedDeliveryDurationMinutes: 0,
      estimatedRoundTripDurationMinutes: 0,
      durationToOrderId: new Map(),
    };
  }

  const durationToAddressId = new Map();
  const durationToOrderId = new Map();
  let currentCoordinates = DEFAULT_BRANCH_COORDINATES;
  let accumulatedDurationInMinutes = 0;

  for (const order of orders) {
    const existingDuration = durationToAddressId.get(order.deliveryAddressId);

    if (existingDuration !== undefined) {
      durationToOrderId.set(order.id, existingDuration);
      continue;
    }

    const durationToStop = await getMapboxRouteDurationInMinutes(
      currentCoordinates,
      parseCoordinates(order),
    );

    accumulatedDurationInMinutes += durationToStop;
    const rounded = Math.ceil(accumulatedDurationInMinutes);
    durationToAddressId.set(order.deliveryAddressId, rounded);
    durationToOrderId.set(order.id, rounded);
    currentCoordinates = parseCoordinates(order);
  }

  const returnDuration = await getMapboxRouteDurationInMinutes(
    currentCoordinates,
    DEFAULT_BRANCH_COORDINATES,
  );

  return {
    estimatedDeliveryDurationMinutes: Math.ceil(accumulatedDurationInMinutes),
    estimatedRoundTripDurationMinutes: Math.ceil(
      accumulatedDurationInMinutes + returnDuration,
    ),
    durationToOrderId,
  };
}

async function claimDispatchAssignmentJobs(limit) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `
        WITH candidate_jobs AS (
          SELECT "id"
          FROM "DispatchAssignmentJob"
          WHERE "status" IN ('PENDING', 'FAILED')
            AND "availableAt" <= NOW()
          ORDER BY "createdAt" ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE "DispatchAssignmentJob" job
        SET
          "status" = 'PROCESSING',
          "attempts" = job."attempts" + 1,
          "processingStartedAt" = NOW()
        FROM candidate_jobs
        WHERE job."id" = candidate_jobs."id"
        RETURNING
          job."id",
          job."orderId",
          job."deliveryAddressId",
          job."attempts"
      `,
      [limit],
    );

    return rows;
  });
}

async function markDispatchAssignmentJobCompleted(jobId) {
  await pool.query(
    `
      UPDATE "DispatchAssignmentJob"
      SET
        "status" = 'COMPLETED',
        "completedAt" = NOW(),
        "lastError" = NULL
      WHERE "id" = $1
    `,
    [jobId],
  );
}

async function markDispatchAssignmentJobFailed(jobId, attempts, error) {
  await pool.query(
    `
      UPDATE "DispatchAssignmentJob"
      SET
        "status" = 'FAILED',
        "availableAt" = $2,
        "lastError" = $3
      WHERE "id" = $1
    `,
    [jobId, getRetryDate(attempts), toErrorMessage(error)],
  );
}

async function isOrderScheduled(orderId) {
  const { rows } = await pool.query(
    `
      SELECT "scheduleFor"
      FROM "Order"
      WHERE "id" = $1
      LIMIT 1
    `,
    [orderId],
  );

  if (!rows[0]) {
    throw new Error(`Order not found: ${orderId}`);
  }

  return rows[0].scheduleFor !== null;
}

async function getDispatchOrderComposition(client, dispatchId, excludeOrderId) {
  const params = [dispatchId];
  let exclusionClause = "";

  if (excludeOrderId) {
    params.push(excludeOrderId);
    exclusionClause = `AND orders."id" != $${params.length}`;
  }

  const { rows } = await client.query(
    `
      SELECT
        COUNT(*)::BIGINT AS "totalOrders",
        COUNT(*) FILTER (WHERE orders."type" = 'TAKEAWAY')::BIGINT AS "takeawayOrders",
        COUNT(*) FILTER (WHERE orders."scheduleFor" IS NOT NULL)::BIGINT AS "scheduledOrders"
      FROM "Order" orders
      WHERE orders."dispatchId" = $1
      ${exclusionClause}
    `,
    params,
  );

  return {
    totalOrders: Number(rows[0]?.totalOrders ?? 0),
    takeawayOrders: Number(rows[0]?.takeawayOrders ?? 0),
    scheduledOrders: Number(rows[0]?.scheduledOrders ?? 0),
  };
}

async function assertDispatchCanReceiveOrder(
  client,
  { dispatchId, orderType, orderScheduled, excludeOrderId },
) {
  const composition = await getDispatchOrderComposition(
    client,
    dispatchId,
    excludeOrderId,
  );

  if (orderType === "TAKEAWAY" && composition.totalOrders > 0) {
    throw new Error("TAKEAWAY_DISPATCH_CAN_ONLY_HAVE_ONE_ORDER");
  }

  if (orderType !== "TAKEAWAY" && composition.takeawayOrders > 0) {
    throw new Error("CANNOT_ADD_ORDER_TO_TAKEAWAY_DISPATCH");
  }

  if (orderScheduled && composition.totalOrders > 0) {
    throw new Error("SCHEDULED_ORDER_REQUIRES_OWN_DISPATCH");
  }

  if (!orderScheduled && composition.scheduledOrders > 0) {
    throw new Error("CANNOT_ADD_ORDER_TO_SCHEDULED_DISPATCH");
  }
}

async function assignOrder(dispatchId, orderId) {
  await withTransaction(async (client) => {
    const dispatchResult = await client.query(
      `
        SELECT "id"
        FROM "Dispatch"
        WHERE "id" = $1
        LIMIT 1
      `,
      [dispatchId],
    );

    if (!dispatchResult.rows[0]) {
      throw new Error(`Dispatch not found: ${dispatchId}`);
    }

    const orderResult = await client.query(
      `
        SELECT "id", "type", "scheduleFor"
        FROM "Order"
        WHERE "id" = $1
        LIMIT 1
      `,
      [orderId],
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    await assertDispatchCanReceiveOrder(client, {
      dispatchId,
      orderType: order.type,
      orderScheduled: order.scheduleFor !== null,
      excludeOrderId: order.id,
    });

    await client.query(
      `
        UPDATE "Order"
        SET
          "dispatchId" = $1,
          "dispatchOrderIndex" = (
            SELECT COALESCE(MAX(existingOrders."dispatchOrderIndex"), 0) + 1
            FROM "Order" existingOrders
            WHERE existingOrders."dispatchId" = $1
          )
        WHERE "id" = $2
      `,
      [dispatchId, orderId],
    );
  });
}

async function autoAssignDriver(dispatchId) {
  await withTransaction(async (client) => {
    const dispatchResult = await client.query(
      `
        SELECT "id", "driverId"
        FROM "Dispatch"
        WHERE "id" = $1
        LIMIT 1
      `,
      [dispatchId],
    );

    const dispatch = dispatchResult.rows[0];

    if (!dispatch) {
      throw new Error(`Dispatch not found: ${dispatchId}`);
    }

    if (dispatch.driverId) {
      return;
    }

    const activeDriversResult = await client.query(
      `
        SELECT "id", "createdAt", "priorityLevel"
        FROM "Driver"
        WHERE "active" = true
        ORDER BY "priorityLevel" ASC, "createdAt" ASC
      `,
    );

    const activeDrivers = activeDriversResult.rows;

    if (activeDrivers.length === 0) {
      return;
    }

    const busyDriversResult = await client.query(
      `
        SELECT DISTINCT ON (driver."id")
          driver."id" AS "driverId",
          driver."createdAt" AS "driverCreatedAt",
          driver."priorityLevel" AS "driverPriorityLevel",
          dispatch."estimatedRoundTripDurationMinutes"
        FROM "Driver" driver
        INNER JOIN "Dispatch" dispatch ON dispatch."driverId" = driver."id"
        WHERE driver."active" = true
          AND dispatch."id" != $1
          AND EXISTS (
            SELECT 1
            FROM "Order" orders
            WHERE orders."dispatchId" = dispatch."id"
              AND orders."deliveredAt" IS NULL
          )
        ORDER BY
          driver."id",
          COALESCE(dispatch."estimatedRoundTripDurationMinutes", 2147483647) ASC,
          dispatch."createdAt" ASC
      `,
      [dispatchId],
    );

    const busyDrivers = busyDriversResult.rows;
    const busyDriverIds = new Set(busyDrivers.map((driver) => driver.driverId));
    const freeDriver = activeDrivers.find((driver) => !busyDriverIds.has(driver.id));

    const selectedBusyDriver = busyDrivers.slice().sort((left, right) => {
      const leftDuration =
        left.estimatedRoundTripDurationMinutes ?? Number.MAX_SAFE_INTEGER;
      const rightDuration =
        right.estimatedRoundTripDurationMinutes ?? Number.MAX_SAFE_INTEGER;

      if (leftDuration !== rightDuration) {
        return leftDuration - rightDuration;
      }

      if (left.driverPriorityLevel !== right.driverPriorityLevel) {
        return left.driverPriorityLevel - right.driverPriorityLevel;
      }

      return (
        new Date(left.driverCreatedAt).getTime() -
        new Date(right.driverCreatedAt).getTime()
      );
    })[0];

    const selectedDriverId = freeDriver?.id || selectedBusyDriver?.driverId;

    if (!selectedDriverId) {
      return;
    }

    await client.query(
      `
        UPDATE "Dispatch"
        SET "driverId" = $1
        WHERE "id" = $2
      `,
      [selectedDriverId, dispatchId],
    );
  });
}

async function createDispatchWithOrder(orderId) {
  return withTransaction(async (client) => {
    const orderResult = await client.query(
      `
        SELECT "id", "type", "scheduleFor"
        FROM "Order"
        WHERE "id" = $1
        LIMIT 1
      `,
      [orderId],
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const dispatchId = randomUUID();

    await client.query(
      `
        INSERT INTO "Dispatch" ("id", "queueIndex", "dispatched", "dispatchAt", "driverId")
        VALUES (
          $1,
          (
            SELECT COALESCE(MAX(dispatch."queueIndex"), 0) + 1
            FROM "Dispatch" dispatch
          ),
          false,
          NULL,
          NULL
        )
      `,
      [dispatchId],
    );

    await client.query(
      `
        UPDATE "Order"
        SET
          "dispatchId" = $1,
          "dispatchOrderIndex" = 1
        WHERE "id" = $2
      `,
      [dispatchId, orderId],
    );

    return dispatchId;
  });
}

async function findMatchingOpenDispatchForDeliveryAddress(deliveryAddressId) {
  const targetAddressResult = await pool.query(
    `
      SELECT "id", "lat", "lng"
      FROM "DeliveryAddress"
      WHERE "id" = $1
      LIMIT 1
    `,
    [deliveryAddressId],
  );
  const targetAddress = targetAddressResult.rows[0];

  if (!targetAddress) {
    throw new Error(`Delivery address not found: ${deliveryAddressId}`);
  }

  const candidateResult = await pool.query(
    `
      SELECT
        dispatch."id" AS "dispatchId",
        deliveryAddress."id" AS "deliveryAddressId",
        orders."createdAt",
        deliveryAddress."lat",
        deliveryAddress."lng"
      FROM "Dispatch" dispatch
      INNER JOIN "Order" orders ON orders."dispatchId" = dispatch."id"
      INNER JOIN "DeliveryAddress" deliveryAddress
        ON deliveryAddress."id" = orders."deliveryAddressId"
      WHERE dispatch."dispatched" = false
        AND orders."deliveryAddressId" IS NOT NULL
        AND orders."deliveredAt" IS NULL
        AND orders."scheduleFor" IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "Order" scheduledOrders
          WHERE scheduledOrders."dispatchId" = dispatch."id"
            AND scheduledOrders."scheduleFor" IS NOT NULL
        )
        AND (
          SELECT COUNT(*)
          FROM "Order" dispatchOrders
          WHERE dispatchOrders."dispatchId" = dispatch."id"
        ) < 3
      ORDER BY dispatch."createdAt" ASC, orders."createdAt" ASC
    `,
  );

  const directDeliveryDurationInMinutes = await getMapboxRouteDurationInMinutes(
    DEFAULT_BRANCH_COORDINATES,
    parseCoordinates(targetAddress),
  );

  const targetStop = {
    routeKey: "__target__",
    deliveryAddressId: targetAddress.id,
    createdAt: new Date(),
    lat: targetAddress.lat,
    lng: targetAddress.lng,
  };

  const stopsByDispatchId = new Map();

  for (const candidate of candidateResult.rows) {
    const current = stopsByDispatchId.get(candidate.dispatchId) || [];
    current.push({
      ...candidate,
      createdAt: new Date(candidate.createdAt),
    });
    stopsByDispatchId.set(candidate.dispatchId, current);
  }

  let bestMatch;

  for (const [dispatchId, dispatchStops] of stopsByDispatchId) {
    const optimizedRoute = await calculateOptimizedRoute([
      ...dispatchStops.map((stop) => ({
        routeKey: stop.deliveryAddressId,
        deliveryAddressId: stop.deliveryAddressId,
        createdAt: stop.createdAt,
        lat: stop.lat,
        lng: stop.lng,
      })),
      targetStop,
    ]);

    const targetDurationInMinutes = optimizedRoute.durationToStopByRouteKey.get(
      targetStop.routeKey,
    );

    if (typeof targetDurationInMinutes !== "number") {
      continue;
    }

    const addedWholeTripDurationInMinutes =
      optimizedRoute.estimatedDeliveryDurationMinutes -
      directDeliveryDurationInMinutes;

    if (addedWholeTripDurationInMinutes > MAX_ROUTE_DURATION_IN_MINUTES) {
      continue;
    }

    if (
      !bestMatch ||
      addedWholeTripDurationInMinutes < bestMatch.addedWholeTripDurationInMinutes ||
      (addedWholeTripDurationInMinutes ===
        bestMatch.addedWholeTripDurationInMinutes &&
        optimizedRoute.estimatedDeliveryDurationMinutes <
          bestMatch.deliveryTripDurationInMinutes) ||
      (addedWholeTripDurationInMinutes ===
        bestMatch.addedWholeTripDurationInMinutes &&
        optimizedRoute.estimatedDeliveryDurationMinutes ===
          bestMatch.deliveryTripDurationInMinutes &&
        optimizedRoute.estimatedRoundTripDurationMinutes <
          bestMatch.roundTripDurationInMinutes)
    ) {
      bestMatch = {
        dispatchId,
        addedWholeTripDurationInMinutes,
        deliveryTripDurationInMinutes:
          optimizedRoute.estimatedDeliveryDurationMinutes,
        roundTripDurationInMinutes:
          optimizedRoute.estimatedRoundTripDurationMinutes,
      };
    }
  }

  return bestMatch?.dispatchId;
}

async function refreshRouteMetrics(dispatchId) {
  const routeOrdersResult = await pool.query(
    `
      SELECT
        orders."id",
        orders."dispatchOrderIndex",
        orders."createdAt",
        deliveryAddress."id" AS "deliveryAddressId",
        deliveryAddress."lat",
        deliveryAddress."lng"
      FROM "Order" orders
      INNER JOIN "DeliveryAddress" deliveryAddress
        ON deliveryAddress."id" = orders."deliveryAddressId"
      WHERE orders."dispatchId" = $1
        AND orders."deliveredAt" IS NULL
      ORDER BY
        orders."dispatchOrderIndex" ASC NULLS LAST,
        orders."createdAt" ASC,
        orders."id" ASC
    `,
    [dispatchId],
  );

  const metrics = await calculateDispatchOrderDeliveryMetricsByPosition(
    routeOrdersResult.rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
    })),
  );

  await withTransaction(async (client) => {
    await client.query(
      `
        UPDATE "Dispatch"
        SET
          "estimatedDeliveryDurationMinutes" = $1,
          "estimatedRoundTripDurationMinutes" = $2
        WHERE "id" = $3
      `,
      [
        metrics.estimatedDeliveryDurationMinutes,
        metrics.estimatedRoundTripDurationMinutes,
        dispatchId,
      ],
    );

    await client.query(
      `
        UPDATE "Order"
        SET "estimatedDeliveryDurationMinutes" = NULL
        WHERE "dispatchId" = $1
      `,
      [dispatchId],
    );

    for (const [orderId, durationInMinutes] of metrics.durationToOrderId) {
      await client.query(
        `
          UPDATE "Order"
          SET "estimatedDeliveryDurationMinutes" = $1
          WHERE "id" = $2
        `,
        [durationInMinutes, orderId],
      );
    }
  });
}

async function assignDeliveryOrderToDispatch({ orderId, deliveryAddressId }) {
  const normalizedOrderId = (orderId || "").trim();
  const normalizedDeliveryAddressId = (deliveryAddressId || "").trim();

  if (!normalizedOrderId) {
    throw new Error("INVALID_ORDER_ID");
  }

  if (!normalizedDeliveryAddressId) {
    throw new Error("INVALID_DELIVERY_ADDRESS_ID");
  }

  const scheduled = await isOrderScheduled(normalizedOrderId);

  const existingDispatchId = scheduled
    ? undefined
    : await findMatchingOpenDispatchForDeliveryAddress(
        normalizedDeliveryAddressId,
      );

  if (existingDispatchId) {
    await assignOrder(existingDispatchId, normalizedOrderId);
    await autoAssignDriver(existingDispatchId);
    await refreshRouteMetrics(existingDispatchId);
    return existingDispatchId;
  }

  const newDispatchId = await createDispatchWithOrder(normalizedOrderId);
  await autoAssignDriver(newDispatchId);
  await refreshRouteMetrics(newDispatchId);
  return newDispatchId;
}

export async function processDispatchAssignmentJobs(limit = DEFAULT_MAX_JOBS_PER_RUN) {
  const normalizedLimit =
    Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_MAX_JOBS_PER_RUN;
  const jobs = await claimDispatchAssignmentJobs(normalizedLimit);

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await assignDeliveryOrderToDispatch({
        orderId: job.orderId,
        deliveryAddressId: job.deliveryAddressId,
      });
      await markDispatchAssignmentJobCompleted(job.id);
      processed += 1;
    } catch (error) {
      await markDispatchAssignmentJobFailed(job.id, job.attempts, error);
      failed += 1;
    }
  }

  return { processed, failed };
}
