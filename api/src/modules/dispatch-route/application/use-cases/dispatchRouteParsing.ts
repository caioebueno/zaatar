import { DispatchRouteInvalidPayloadError } from "../errors/DispatchRouteInvalidPayloadError.js";
import type {
  DispatchRoutePointSource,
  InsertDispatchRoutePointInput,
} from "../ports/DispatchRouteRepository.js";

const POINT_SOURCES: DispatchRoutePointSource[] = ["GPS", "NETWORK", "MANUAL"];

export function normalizeDispatchId(value: unknown): string {
  if (typeof value !== "string") {
    throw new DispatchRouteInvalidPayloadError("dispatchId");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new DispatchRouteInvalidPayloadError("dispatchId");
  }

  return normalized;
}

export function normalizeDriverId(value: unknown): string {
  if (typeof value !== "string") {
    throw new DispatchRouteInvalidPayloadError("driverId");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new DispatchRouteInvalidPayloadError("driverId");
  }

  return normalized;
}

export function normalizeSessionId(value: unknown): string {
  if (typeof value !== "string") {
    throw new DispatchRouteInvalidPayloadError("sessionId");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new DispatchRouteInvalidPayloadError("sessionId");
  }

  return normalized;
}

export function normalizeOptionalDate(
  value: unknown,
  field: string,
): Date | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  return date;
}

export function normalizePoints(value: unknown): InsertDispatchRoutePointInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new DispatchRouteInvalidPayloadError("points");
  }

  if (value.length > 500) {
    throw new DispatchRouteInvalidPayloadError("points");
  }

  return value.map((point, index) => normalizePoint(point, index));
}

export function normalizeLocationPoint(value: unknown): InsertDispatchRoutePointInput {
  return normalizePoint(value, -1, "location");
}

function normalizePoint(
  value: unknown,
  index: number,
  fieldPrefix = `points[${index}]`,
): InsertDispatchRoutePointInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DispatchRouteInvalidPayloadError(fieldPrefix);
  }

  const point = value as Record<string, unknown>;

  return {
    lat: normalizeNumber(point.lat, `${fieldPrefix}.lat`, -90, 90),
    lng: normalizeNumber(point.lng, `${fieldPrefix}.lng`, -180, 180),
    recordedAt:
      normalizeOptionalDate(point.recordedAt, `${fieldPrefix}.recordedAt`) ??
      new Date(),
    accuracyMeters: normalizeOptionalNumber(
      point.accuracyMeters,
      `${fieldPrefix}.accuracyMeters`,
      0,
    ),
    speedMps: normalizeOptionalNumber(
      point.speedMps,
      `${fieldPrefix}.speedMps`,
      0,
    ),
    headingDegrees: normalizeOptionalNumber(
      point.headingDegrees,
      `${fieldPrefix}.headingDegrees`,
      0,
      360,
    ),
    altitudeMeters: normalizeOptionalNumber(
      point.altitudeMeters,
      `${fieldPrefix}.altitudeMeters`,
    ),
    source: normalizeSource(point.source, `${fieldPrefix}.source`),
    isMocked: normalizeOptionalBoolean(point.isMocked, `${fieldPrefix}.isMocked`),
  };
}

function normalizeSource(value: unknown, field: string): DispatchRoutePointSource {
  if (value === undefined || value === null || value === "") {
    return "GPS";
  }

  if (typeof value !== "string") {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  const normalized = value.trim().toUpperCase() as DispatchRoutePointSource;
  if (!POINT_SOURCES.includes(normalized)) {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  return normalized;
}

function normalizeNumber(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed)) {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  if (min !== undefined && parsed < min) {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  if (max !== undefined && parsed > max) {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  return parsed;
}

function normalizeOptionalNumber(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return normalizeNumber(value, field, min, max);
}

function normalizeOptionalBoolean(value: unknown, field: string): boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "boolean") {
    throw new DispatchRouteInvalidPayloadError(field);
  }

  return value;
}
