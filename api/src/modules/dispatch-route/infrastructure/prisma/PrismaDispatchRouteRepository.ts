import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type {
  CompleteDispatchRouteSessionInput,
  CreateDispatchRouteMilestoneInput,
  CreateDispatchRouteSessionInput,
  DispatchRouteMilestoneType,
  DispatchRoutePointRecord,
  DispatchRoutePointSource,
  DispatchRouteRepository,
  DispatchRouteSessionRecord,
  DispatchRouteSessionStatus,
  DispatchRouteSessionWithPoints,
  InsertDispatchRoutePointInput,
} from "../../application/ports/DispatchRouteRepository.js";

type SessionRow = {
  createdAt: Date;
  dispatchId: string;
  driverId: string;
  durationSeconds: number | null;
  endedAt: Date | null;
  id: string;
  polyline: string | null;
  startedAt: Date;
  status: string;
  totalDistanceMeters: number | null;
  updatedAt: Date;
};

type PointRow = {
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  createdAt: Date;
  headingDegrees: number | null;
  id: string;
  isMocked: boolean | null;
  lat: number;
  lng: number;
  recordedAt: Date;
  sequence: number;
  sessionId: string;
  source: string;
  speedMps: number | null;
};

type MaxSequenceRow = {
  maxSequence: number | null;
};

type DispatchOriginRow = {
  lat: string | null;
  lng: string | null;
};

type DispatchDropOffRow = {
  orderId: string;
  lat: string | null;
  lng: string | null;
};

type MilestoneExistsRow = {
  ok: number;
};

const SESSION_STATUS: DispatchRouteSessionStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "CANCELED",
];
const POINT_SOURCE: DispatchRoutePointSource[] = ["GPS", "NETWORK", "MANUAL"];

export class PrismaDispatchRouteRepository implements DispatchRouteRepository {
  async completeSession(
    input: CompleteDispatchRouteSessionInput,
  ): Promise<DispatchRouteSessionRecord | null> {
    const rows = await prisma.$queryRaw<SessionRow[]>`
      UPDATE "DispatchRouteSession"
      SET
        "status" = 'COMPLETED'::"DispatchRouteSessionStatus",
        "endedAt" = ${input.endedAt},
        "durationSeconds" = ${input.durationSeconds},
        "totalDistanceMeters" = ${input.totalDistanceMeters},
        "updatedAt" = NOW()
      WHERE "id" = ${input.sessionId}
        AND "status" = 'ACTIVE'::"DispatchRouteSessionStatus"
      RETURNING
        "id",
        "createdAt",
        "updatedAt",
        "dispatchId",
        "driverId",
        "startedAt",
        "endedAt",
        "status"::text AS "status",
        "totalDistanceMeters",
        "durationSeconds",
        "polyline"
    `;

    const row = rows[0];
    return row ? mapSession(row) : null;
  }

  async createSession(
    input: CreateDispatchRouteSessionInput,
  ): Promise<DispatchRouteSessionRecord> {
    const sessionId = randomUUID();
    const now = new Date();
    const rows = await prisma.$queryRaw<SessionRow[]>`
      INSERT INTO "DispatchRouteSession" (
        "id",
        "dispatchId",
        "driverId",
        "startedAt",
        "status",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${sessionId},
        ${input.dispatchId},
        ${input.driverId},
        ${input.startedAt},
        'ACTIVE'::"DispatchRouteSessionStatus",
        ${now},
        ${now}
      )
      RETURNING
        "id",
        "createdAt",
        "updatedAt",
        "dispatchId",
        "driverId",
        "startedAt",
        "endedAt",
        "status"::text AS "status",
        "totalDistanceMeters",
        "durationSeconds",
        "polyline"
    `;

    const created = rows[0];
    if (!created) {
      throw new Error("Failed to create dispatch route session");
    }

    return mapSession(created);
  }

  async driverOwnsDispatch(dispatchId: string, driverId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ ok: number }>>`
      SELECT 1::int AS "ok"
      FROM "Dispatch"
      WHERE "id" = ${dispatchId}
        AND "driverId" = ${driverId}
      LIMIT 1
    `;

    return rows.length > 0;
  }

  async findActiveDispatchIdForDriver(driverId: string): Promise<string | null> {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT dispatch."id"
      FROM "Dispatch" dispatch
      WHERE dispatch."driverId" = ${driverId}
        AND dispatch."startedDeliveryAt" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "DispatchRouteMilestone" milestone
          WHERE milestone."dispatchId" = dispatch."id"
            AND milestone."type" = 'ARRIVED_RESTAURANT'::"DispatchRouteMilestoneType"
        )
      ORDER BY
        dispatch."startedDeliveryAt" DESC,
        dispatch."createdAt" DESC
      LIMIT 1
    `;

    return rows[0]?.id ?? null;
  }

  async findActiveSession(
    dispatchId: string,
    driverId: string,
  ): Promise<DispatchRouteSessionRecord | null> {
    const rows = await prisma.$queryRaw<SessionRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "dispatchId",
        "driverId",
        "startedAt",
        "endedAt",
        "status"::text AS "status",
        "totalDistanceMeters",
        "durationSeconds",
        "polyline"
      FROM "DispatchRouteSession"
      WHERE "dispatchId" = ${dispatchId}
        AND "driverId" = ${driverId}
        AND "status" = 'ACTIVE'::"DispatchRouteSessionStatus"
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    const row = rows[0];
    return row ? mapSession(row) : null;
  }

  async findSessionForDriver(
    sessionId: string,
    dispatchId: string,
    driverId: string,
  ): Promise<DispatchRouteSessionRecord | null> {
    const rows = await prisma.$queryRaw<SessionRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "dispatchId",
        "driverId",
        "startedAt",
        "endedAt",
        "status"::text AS "status",
        "totalDistanceMeters",
        "durationSeconds",
        "polyline"
      FROM "DispatchRouteSession"
      WHERE "id" = ${sessionId}
        AND "dispatchId" = ${dispatchId}
        AND "driverId" = ${driverId}
      LIMIT 1
    `;

    const row = rows[0];
    return row ? mapSession(row) : null;
  }

  async enqueueEtaRecalculation(dispatchId: string): Promise<void> {
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "DispatchEtaRecalculationJob" (
        "id",
        "createdAt",
        "updatedAt",
        "dispatchId",
        "status",
        "availableAt"
      )
      VALUES (
        ${randomUUID()},
        ${now},
        ${now},
        ${dispatchId},
        'PENDING'::"DispatchEtaRecalculationJobStatus",
        ${now}
      )
      ON CONFLICT ("dispatchId")
      DO UPDATE SET
        "status" = 'PENDING'::"DispatchEtaRecalculationJobStatus",
        "availableAt" = NOW(),
        "processingStartedAt" = NULL,
        "completedAt" = NULL,
        "lastError" = NULL,
        "updatedAt" = NOW()
    `;
  }

  async insertPointsBatch(
    sessionId: string,
    points: InsertDispatchRoutePointInput[],
  ): Promise<{ insertedCount: number; lastSequence: number }> {
    if (points.length === 0) {
      return { insertedCount: 0, lastSequence: 0 };
    }

    return prisma.$transaction(async (tx) => {
      // Serialize sequence allocation per session so concurrent location writes
      // cannot read the same MAX(sequence) and insert duplicate values.
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "DispatchRouteSession"
        WHERE "id" = ${sessionId}
        FOR UPDATE
      `;

      const [maxSequenceRow] = await tx.$queryRaw<MaxSequenceRow[]>`
        SELECT MAX("sequence")::int AS "maxSequence"
        FROM "DispatchRoutePoint"
        WHERE "sessionId" = ${sessionId}
      `;

      let currentSequence = maxSequenceRow?.maxSequence ?? 0;

      const rowsSql = points.map((point) => {
        currentSequence += 1;
        return Prisma.sql`(
          ${randomUUID()},
          ${sessionId},
          ${currentSequence},
          ${point.recordedAt},
          ${point.lat},
          ${point.lng},
          ${point.accuracyMeters},
          ${point.speedMps},
          ${point.headingDegrees},
          ${point.altitudeMeters},
          ${point.source}::"DispatchRoutePointSource",
          ${point.isMocked}
        )`;
      });

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "DispatchRoutePoint" (
          "id",
          "sessionId",
          "sequence",
          "recordedAt",
          "lat",
          "lng",
          "accuracyMeters",
          "speedMps",
          "headingDegrees",
          "altitudeMeters",
          "source",
          "isMocked"
        )
        VALUES ${Prisma.join(rowsSql)}
      `);

      return {
        insertedCount: points.length,
        lastSequence: currentSequence,
      };
    });
  }

  async listPointsBySessionId(sessionId: string): Promise<DispatchRoutePointRecord[]> {
    const rows = await prisma.$queryRaw<PointRow[]>`
      SELECT
        "id",
        "createdAt",
        "sessionId",
        "sequence",
        "recordedAt",
        "lat",
        "lng",
        "accuracyMeters",
        "speedMps",
        "headingDegrees",
        "altitudeMeters",
        "source"::text AS "source",
        "isMocked"
      FROM "DispatchRoutePoint"
      WHERE "sessionId" = ${sessionId}
      ORDER BY "sequence" ASC, "recordedAt" ASC
    `;

    return rows.map(mapPoint);
  }

  async listRecentPointsBySessionId(
    sessionId: string,
    limit: number,
  ): Promise<DispatchRoutePointRecord[]> {
    const safeLimit = Number.isInteger(limit) ? Math.max(1, Math.min(limit, 100)) : 20;

    const rows = await prisma.$queryRaw<PointRow[]>`
      SELECT
        "id",
        "createdAt",
        "sessionId",
        "sequence",
        "recordedAt",
        "lat",
        "lng",
        "accuracyMeters",
        "speedMps",
        "headingDegrees",
        "altitudeMeters",
        "source"::text AS "source",
        "isMocked"
      FROM "DispatchRoutePoint"
      WHERE "sessionId" = ${sessionId}
      ORDER BY "sequence" DESC, "recordedAt" DESC
      LIMIT ${safeLimit}
    `;

    return rows.map(mapPoint).reverse();
  }

  async listSessionsByDispatchId(
    dispatchId: string,
  ): Promise<DispatchRouteSessionWithPoints[]> {
    const sessionsRows = await prisma.$queryRaw<SessionRow[]>`
      SELECT
        "id",
        "createdAt",
        "updatedAt",
        "dispatchId",
        "driverId",
        "startedAt",
        "endedAt",
        "status"::text AS "status",
        "totalDistanceMeters",
        "durationSeconds",
        "polyline"
      FROM "DispatchRouteSession"
      WHERE "dispatchId" = ${dispatchId}
      ORDER BY "createdAt" ASC
    `;

    if (sessionsRows.length === 0) {
      return [];
    }

    const sessions = sessionsRows.map(mapSession);
    const sessionIds = sessions.map((session) => session.id);

    const pointRows = await prisma.$queryRaw<PointRow[]>`
      SELECT
        "id",
        "createdAt",
        "sessionId",
        "sequence",
        "recordedAt",
        "lat",
        "lng",
        "accuracyMeters",
        "speedMps",
        "headingDegrees",
        "altitudeMeters",
        "source"::text AS "source",
        "isMocked"
      FROM "DispatchRoutePoint"
      WHERE "sessionId" IN (${Prisma.join(sessionIds)})
      ORDER BY "sessionId" ASC, "sequence" ASC, "recordedAt" ASC
    `;

    const pointsBySessionId = new Map<string, DispatchRoutePointRecord[]>();

    for (const row of pointRows) {
      const points = pointsBySessionId.get(row.sessionId) ?? [];
      points.push(mapPoint(row));
      pointsBySessionId.set(row.sessionId, points);
    }

    return sessions.map((session) => ({
      ...session,
      points: pointsBySessionId.get(session.id) ?? [],
    }));
  }

  async findDispatchOriginCoordinates(
    dispatchId: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const rows = await prisma.$queryRaw<DispatchOriginRow[]>`
      SELECT
        address."lat" AS "lat",
        address."lng" AS "lng"
      FROM "Order" ord
      INNER JOIN "Branch" branch
        ON branch."id" = ord."branchId"
      INNER JOIN "Address" address
        ON address."id" = branch."addressId"
      WHERE ord."dispatchId" = ${dispatchId}
        AND address."lat" IS NOT NULL
        AND address."lng" IS NOT NULL
      ORDER BY ord."createdAt" ASC
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    const lat = Number.parseFloat(row.lat ?? "");
    const lng = Number.parseFloat(row.lng ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  }

  async findNextDropOffOrderTarget(
    dispatchId: string,
  ): Promise<{ lat: number; lng: number; orderId: string } | null> {
    const rows = await prisma.$queryRaw<DispatchDropOffRow[]>`
      SELECT
        ord."id" AS "orderId",
        delivery_address."lat" AS "lat",
        delivery_address."lng" AS "lng"
      FROM "Order" ord
      INNER JOIN "DeliveryAddress" delivery_address
        ON delivery_address."id" = ord."deliveryAddressId"
      WHERE ord."dispatchId" = ${dispatchId}
        AND ord."canceled" = false
        AND ord."deliveredAt" IS NULL
        AND ord."leftAtDropOffAt" IS NULL
        AND delivery_address."lat" IS NOT NULL
        AND delivery_address."lng" IS NOT NULL
      ORDER BY
        ord."dispatchOrderIndex" ASC NULLS LAST,
        ord."createdAt" ASC
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    const lat = Number.parseFloat(row.lat ?? "");
    const lng = Number.parseFloat(row.lng ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { orderId: row.orderId, lat, lng };
  }

  async createMilestoneIfMissing(input: CreateDispatchRouteMilestoneInput): Promise<boolean> {
    const now = new Date();
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "DispatchRouteMilestone" (
          "id",
          "createdAt",
          "updatedAt",
          "dispatchId",
          "driverId",
          "sessionId",
          "type",
          "recordedAt",
          "lat",
          "lng"
        )
        VALUES (
          ${randomUUID()},
          ${now},
          ${now},
          ${input.dispatchId},
          ${input.driverId},
          ${input.sessionId},
          ${input.type}::"DispatchRouteMilestoneType",
          ${input.recordedAt},
          ${input.lat},
          ${input.lng}
        )
        ON CONFLICT ("dispatchId", "type")
        DO NOTHING
        RETURNING "id"
      `;

    return result.length > 0;
  }

  async markOrderLeftDropOffIfMissing(input: {
    lat: number;
    lng: number;
    orderId: string;
    recordedAt: Date;
  }): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Order"
      SET
        "leftAtDropOffAt" = ${input.recordedAt},
        "leftAtDropOffLat" = ${input.lat},
        "leftAtDropOffLng" = ${input.lng}
      WHERE "id" = ${input.orderId}
        AND "leftAtDropOffAt" IS NULL
      RETURNING "id"
    `;

    return rows.length > 0;
  }

  async markDispatchArrivedAtRestaurantIfMissing(input: {
    dispatchId: string;
    lat: number;
    lng: number;
    recordedAt: Date;
  }): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Dispatch"
      SET
        "arrivedAtRestaurantAt" = ${input.recordedAt},
        "arrivedAtRestaurantLat" = ${input.lat},
        "arrivedAtRestaurantLng" = ${input.lng}
      WHERE "id" = ${input.dispatchId}
        AND "arrivedAtRestaurantAt" IS NULL
        AND EXISTS (
          SELECT 1
          FROM "Order" ord
          WHERE ord."dispatchId" = ${input.dispatchId}
            AND ord."canceled" = false
            AND ord."leftAtDropOffAt" IS NOT NULL
        )
      RETURNING "id"
    `;

    return rows.length > 0;
  }

  async markDispatchLeftRestaurantIfMissing(input: {
    dispatchId: string;
    lat: number;
    lng: number;
    recordedAt: Date;
  }): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Dispatch"
      SET
        "leftRestaurantAt" = ${input.recordedAt},
        "leftRestaurantLat" = ${input.lat},
        "leftRestaurantLng" = ${input.lng}
      WHERE "id" = ${input.dispatchId}
        AND "leftRestaurantAt" IS NULL
      RETURNING "id"
    `;

    return rows.length > 0;
  }

  async hasMilestone(
    dispatchId: string,
    type: DispatchRouteMilestoneType,
  ): Promise<boolean> {
    const rows = await prisma.$queryRaw<MilestoneExistsRow[]>`
      SELECT 1::int AS "ok"
      FROM "DispatchRouteMilestone"
      WHERE "dispatchId" = ${dispatchId}
        AND "type" = ${type}::"DispatchRouteMilestoneType"
      LIMIT 1
    `;

    return rows.length > 0;
  }
}

function mapSession(row: SessionRow): DispatchRouteSessionRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    dispatchId: row.dispatchId,
    driverId: row.driverId,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    status: parseSessionStatus(row.status),
    totalDistanceMeters: row.totalDistanceMeters,
    durationSeconds: row.durationSeconds,
    polyline: row.polyline,
  };
}

function mapPoint(row: PointRow): DispatchRoutePointRecord {
  return {
    id: row.id,
    createdAt: row.createdAt,
    sessionId: row.sessionId,
    sequence: row.sequence,
    recordedAt: row.recordedAt,
    lat: row.lat,
    lng: row.lng,
    accuracyMeters: row.accuracyMeters,
    speedMps: row.speedMps,
    headingDegrees: row.headingDegrees,
    altitudeMeters: row.altitudeMeters,
    source: parsePointSource(row.source),
    isMocked: row.isMocked,
  };
}

function parseSessionStatus(value: string): DispatchRouteSessionStatus {
  if (SESSION_STATUS.includes(value as DispatchRouteSessionStatus)) {
    return value as DispatchRouteSessionStatus;
  }
  return "ACTIVE";
}

function parsePointSource(value: string): DispatchRoutePointSource {
  if (POINT_SOURCE.includes(value as DispatchRoutePointSource)) {
    return value as DispatchRoutePointSource;
  }
  return "GPS";
}
