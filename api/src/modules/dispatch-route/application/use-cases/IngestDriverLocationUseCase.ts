import { DriverActiveDispatchNotFoundError } from "../errors/DriverActiveDispatchNotFoundError.js";
import type { DispatchRouteRepository } from "../ports/DispatchRouteRepository.js";
import { normalizeDriverId, normalizeLocationPoint } from "./dispatchRouteParsing.js";

export type IngestDriverLocationInput = {
  driverId: unknown;
  location: unknown;
};

export type IngestDriverLocationOutput = {
  arrivedAtRestaurantTracked: boolean;
  dispatchId: string;
  insertedCount: number;
  lastSequence: number;
  leftAtDropOffTracked: boolean;
  leftPizzeriaTracked: boolean;
  sessionId: string;
};

export class IngestDriverLocationUseCase {
  constructor(private readonly repository: DispatchRouteRepository) {}

  async execute(
    input: IngestDriverLocationInput,
  ): Promise<IngestDriverLocationOutput> {
    const driverId = normalizeDriverId(input.driverId);
    const point = normalizeLocationPoint(input.location);

    const dispatchId = await this.repository.findActiveDispatchIdForDriver(driverId);
    if (!dispatchId) {
      throw new DriverActiveDispatchNotFoundError();
    }

    let session = await this.repository.findActiveSession(dispatchId, driverId);
    if (!session) {
      session = await this.repository.createSession({
        dispatchId,
        driverId,
        startedAt: new Date(),
      });
    }

    const result = await this.repository.insertPointsBatch(session.id, [point]);
    let arrivedAtRestaurantTracked = false;
    let leftAtDropOffTracked = false;
    let leftPizzeriaTracked = false;

    if (result.insertedCount > 0) {
      await this.repository.enqueueEtaRecalculation(dispatchId);
      leftPizzeriaTracked = await this.trackLeftPizzeriaMilestone({
        dispatchId,
        driverId,
        sessionId: session.id,
      });
      leftAtDropOffTracked = await this.trackLeftDropOffMilestone({
        dispatchId,
        driverId,
        sessionId: session.id,
      });
      arrivedAtRestaurantTracked = await this.trackArrivedAtRestaurantMilestone({
        dispatchId,
        driverId,
        sessionId: session.id,
      });

      if (arrivedAtRestaurantTracked) {
        await this.completeSessionAtRestaurantArrival({
          session,
          endedAt: point.recordedAt,
        });
      }
    }

    return {
      dispatchId,
      sessionId: session.id,
      insertedCount: result.insertedCount,
      lastSequence: result.lastSequence,
      leftAtDropOffTracked,
      arrivedAtRestaurantTracked,
      leftPizzeriaTracked,
    };
  }

  private async trackLeftPizzeriaMilestone(input: {
    dispatchId: string;
    driverId: string;
    sessionId: string;
  }): Promise<boolean> {
    const alreadyTracked = await this.repository.hasMilestone(
      input.dispatchId,
      "LEFT_PIZZERIA",
    );
    if (alreadyTracked) {
      return false;
    }

    const origin = await this.repository.findDispatchOriginCoordinates(input.dispatchId);
    if (!origin) {
      return false;
    }

    const points = await this.repository.listRecentPointsBySessionId(input.sessionId, 24);
    const validPoints = points.filter((point) => isPointValidForGeofence(point));
    const latestPoint = validPoints[validPoints.length - 1];
    if (!latestPoint) {
      return false;
    }

    const distanceToRestaurant = haversineDistanceMeters(
      origin.lat,
      origin.lng,
      latestPoint.lat,
      latestPoint.lng,
    );
    if (distanceToRestaurant <= LEFT_PIZZERIA_OUTSIDE_RADIUS_METERS) {
      return false;
    }

    const marked = await this.repository.markDispatchLeftRestaurantIfMissing({
      dispatchId: input.dispatchId,
      recordedAt: latestPoint.recordedAt,
      lat: latestPoint.lat,
      lng: latestPoint.lng,
    });
    if (!marked) {
      return false;
    }

    await this.repository.createMilestoneIfMissing({
      type: "LEFT_PIZZERIA",
      dispatchId: input.dispatchId,
      driverId: input.driverId,
      sessionId: input.sessionId,
      recordedAt: latestPoint.recordedAt,
      lat: latestPoint.lat,
      lng: latestPoint.lng,
    });

    return true;
  }

  private async trackLeftDropOffMilestone(input: {
    dispatchId: string;
    driverId: string;
    sessionId: string;
  }): Promise<boolean> {
    const dropOffTarget = await this.repository.findNextDropOffOrderTarget(
      input.dispatchId,
    );
    if (!dropOffTarget) {
      return false;
    }

    const points = await this.repository.listRecentPointsBySessionId(input.sessionId, 24);
    const validPoints = points.filter((point) => isPointValidForGeofence(point));
    if (validPoints.length < 4) {
      return false;
    }

    const distances = validPoints.map((point) => ({
      point,
      distanceMeters: haversineDistanceMeters(
        dropOffTarget.lat,
        dropOffTarget.lng,
        point.lat,
        point.lng,
      ),
    }));

    const hasInsideEvidence = distances.some(
      (entry) => entry.distanceMeters <= DROP_OFF_INSIDE_RADIUS_METERS,
    );
    if (!hasInsideEvidence) {
      return false;
    }

    const trailing = distances.slice(-DROP_OFF_OUTSIDE_STREAK_REQUIRED);
    const outsideStreak =
      trailing.length === DROP_OFF_OUTSIDE_STREAK_REQUIRED &&
      trailing.every(
        (entry) =>
          entry.distanceMeters > DROP_OFF_OUTSIDE_RADIUS_METERS &&
          isPointMoving(entry.point),
      );

    if (!outsideStreak) {
      return false;
    }

    const triggerPoint = trailing[0]?.point;
    if (!triggerPoint) {
      return false;
    }

    return this.repository.markOrderLeftDropOffIfMissing({
      orderId: dropOffTarget.orderId,
      recordedAt: triggerPoint.recordedAt,
      lat: triggerPoint.lat,
      lng: triggerPoint.lng,
    });
  }

  private async trackArrivedAtRestaurantMilestone(input: {
    dispatchId: string;
    driverId: string;
    sessionId: string;
  }): Promise<boolean> {
    const alreadyTracked = await this.repository.hasMilestone(
      input.dispatchId,
      "ARRIVED_RESTAURANT",
    );
    if (alreadyTracked) {
      return false;
    }

    const restaurant = await this.repository.findDispatchOriginCoordinates(input.dispatchId);
    if (!restaurant) {
      return false;
    }

    const points = await this.repository.listRecentPointsBySessionId(input.sessionId, 24);
    const validPoints = points.filter((point) => isPointValidForGeofence(point));
    const latestPoint = validPoints[validPoints.length - 1];
    if (!latestPoint) {
      return false;
    }

    const distanceToRestaurant = haversineDistanceMeters(
      restaurant.lat,
      restaurant.lng,
      latestPoint.lat,
      latestPoint.lng,
    );

    if (distanceToRestaurant > RESTAURANT_ARRIVAL_RADIUS_METERS) {
      return false;
    }

    const marked = await this.repository.markDispatchArrivedAtRestaurantIfMissing({
      dispatchId: input.dispatchId,
      recordedAt: latestPoint.recordedAt,
      lat: latestPoint.lat,
      lng: latestPoint.lng,
    });
    if (!marked) {
      return false;
    }

    await this.repository.createMilestoneIfMissing({
      type: "ARRIVED_RESTAURANT",
      dispatchId: input.dispatchId,
      driverId: input.driverId,
      sessionId: input.sessionId,
      recordedAt: latestPoint.recordedAt,
      lat: latestPoint.lat,
      lng: latestPoint.lng,
    });

    return true;
  }

  private async completeSessionAtRestaurantArrival(input: {
    endedAt: Date;
    session: { id: string; startedAt: Date };
  }): Promise<void> {
    const points = await this.repository.listPointsBySessionId(input.session.id);
    const totalDistanceMeters = calculateTotalDistanceMeters(points);
    const durationSeconds = Math.max(
      0,
      Math.round((input.endedAt.getTime() - input.session.startedAt.getTime()) / 1000),
    );

    await this.repository.completeSession({
      sessionId: input.session.id,
      endedAt: input.endedAt,
      durationSeconds,
      totalDistanceMeters,
    });
  }
}

const LEFT_PIZZERIA_OUTSIDE_RADIUS_METERS = parsePositiveNumber(
  process.env.DISPATCH_LEFT_PIZZERIA_OUTSIDE_RADIUS_METERS,
  120,
);
const MAX_ACCEPTABLE_ACCURACY_METERS = parsePositiveNumber(
  process.env.DISPATCH_LOCATION_MAX_ACCURACY_METERS,
  100,
);
const MIN_MOVING_SPEED_MPS = parsePositiveNumber(
  process.env.DISPATCH_LEFT_PIZZERIA_MIN_SPEED_MPS,
  1.5,
);
const DROP_OFF_INSIDE_RADIUS_METERS = parsePositiveNumber(
  process.env.DISPATCH_LEFT_DROPOFF_INSIDE_RADIUS_METERS,
  60,
);
const DROP_OFF_OUTSIDE_RADIUS_METERS = parsePositiveNumber(
  process.env.DISPATCH_LEFT_DROPOFF_OUTSIDE_RADIUS_METERS,
  100,
);
const DROP_OFF_OUTSIDE_STREAK_REQUIRED = Math.max(
  2,
  Math.round(
    parsePositiveNumber(process.env.DISPATCH_LEFT_DROPOFF_STREAK_POINTS, 3),
  ),
);
const RESTAURANT_ARRIVAL_RADIUS_METERS = parsePositiveNumber(
  process.env.DISPATCH_ARRIVED_RESTAURANT_RADIUS_METERS,
  70,
);

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function isPointValidForGeofence(point: {
  accuracyMeters: number | null;
  isMocked: boolean | null;
}): boolean {
  if (point.isMocked === true) {
    return false;
  }

  if (typeof point.accuracyMeters === "number") {
    return point.accuracyMeters <= MAX_ACCEPTABLE_ACCURACY_METERS;
  }

  return true;
}

function isPointMoving(point: { speedMps: number | null }): boolean {
  if (typeof point.speedMps !== "number" || !Number.isFinite(point.speedMps)) {
    return true;
  }

  return point.speedMps >= MIN_MOVING_SPEED_MPS;
}

function calculateTotalDistanceMeters(
  points: Array<{ lat: number; lng: number }>,
): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (!previous || !current) continue;
    total += haversineDistanceMeters(previous.lat, previous.lng, current.lat, current.lng);
  }

  return Math.round(total);
}

function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6_371_000;

  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const originLat = toRadians(lat1);
  const targetLat = toRadians(lat2);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(originLat) *
      Math.cos(targetLat) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}
