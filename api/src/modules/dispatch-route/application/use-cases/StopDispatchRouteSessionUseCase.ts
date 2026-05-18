import { DriverDispatchAccessDeniedError } from "../errors/DriverDispatchAccessDeniedError.js";
import { DispatchRouteSessionClosedError } from "../errors/DispatchRouteSessionClosedError.js";
import { DispatchRouteSessionNotFoundError } from "../errors/DispatchRouteSessionNotFoundError.js";
import type {
  DispatchRouteRepository,
  DispatchRouteSessionRecord,
} from "../ports/DispatchRouteRepository.js";
import {
  normalizeDispatchId,
  normalizeDriverId,
  normalizeOptionalDate,
  normalizeSessionId,
} from "./dispatchRouteParsing.js";

export type StopDispatchRouteSessionInput = {
  dispatchId: unknown;
  driverId: unknown;
  endedAt?: unknown;
  sessionId: unknown;
};

export type StopDispatchRouteSessionOutput = {
  pointsCount: number;
  session: DispatchRouteSessionRecord;
};

export class StopDispatchRouteSessionUseCase {
  constructor(private readonly repository: DispatchRouteRepository) {}

  async execute(
    input: StopDispatchRouteSessionInput,
  ): Promise<StopDispatchRouteSessionOutput> {
    const dispatchId = normalizeDispatchId(input.dispatchId);
    const driverId = normalizeDriverId(input.driverId);
    const sessionId = normalizeSessionId(input.sessionId);
    const endedAt = normalizeOptionalDate(input.endedAt, "endedAt") ?? new Date();

    const driverOwnsDispatch = await this.repository.driverOwnsDispatch(
      dispatchId,
      driverId,
    );
    if (!driverOwnsDispatch) {
      throw new DriverDispatchAccessDeniedError();
    }

    const session = await this.repository.findSessionForDriver(
      sessionId,
      dispatchId,
      driverId,
    );
    if (!session) {
      throw new DispatchRouteSessionNotFoundError();
    }

    if (session.status !== "ACTIVE") {
      throw new DispatchRouteSessionClosedError();
    }

    const points = await this.repository.listPointsBySessionId(session.id);
    const totalDistanceMeters = calculateTotalDistanceMeters(points);

    const durationSeconds = Math.max(
      0,
      Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    const completed = await this.repository.completeSession({
      sessionId: session.id,
      endedAt,
      durationSeconds,
      totalDistanceMeters,
    });

    if (!completed) {
      throw new DispatchRouteSessionNotFoundError();
    }

    return {
      session: completed,
      pointsCount: points.length,
    };
  }
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
    total += haversineMeters(previous.lat, previous.lng, current.lat, current.lng);
  }

  return Math.round(total);
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const EARTH_RADIUS_METERS = 6371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const latDistance = toRadians(lat2 - lat1);
  const lngDistance = toRadians(lng2 - lng1);

  const normalizedLat1 = toRadians(lat1);
  const normalizedLat2 = toRadians(lat2);

  const value =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(normalizedLat1) *
      Math.cos(normalizedLat2) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  const arc = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return EARTH_RADIUS_METERS * arc;
}

