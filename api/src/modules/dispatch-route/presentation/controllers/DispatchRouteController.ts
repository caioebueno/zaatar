import { DriverDispatchAccessDeniedError } from "../../application/errors/DriverDispatchAccessDeniedError.js";
import { DriverActiveDispatchNotFoundError } from "../../application/errors/DriverActiveDispatchNotFoundError.js";
import { DispatchRouteInvalidPayloadError } from "../../application/errors/DispatchRouteInvalidPayloadError.js";
import { DispatchRouteSessionClosedError } from "../../application/errors/DispatchRouteSessionClosedError.js";
import { DispatchRouteSessionNotFoundError } from "../../application/errors/DispatchRouteSessionNotFoundError.js";
import type { AddDispatchRoutePointsBatchUseCase } from "../../application/use-cases/AddDispatchRoutePointsBatchUseCase.js";
import type { GetDispatchRouteUseCase } from "../../application/use-cases/GetDispatchRouteUseCase.js";
import type { IngestDriverLocationUseCase } from "../../application/use-cases/IngestDriverLocationUseCase.js";
import type { StartDispatchRouteSessionUseCase } from "../../application/use-cases/StartDispatchRouteSessionUseCase.js";
import type { StopDispatchRouteSessionUseCase } from "../../application/use-cases/StopDispatchRouteSessionUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class DispatchRouteController implements HttpController {
  constructor(
    private readonly startUseCase: StartDispatchRouteSessionUseCase,
    private readonly addPointsBatchUseCase: AddDispatchRoutePointsBatchUseCase,
    private readonly ingestDriverLocationUseCase: IngestDriverLocationUseCase,
    private readonly stopUseCase: StopDispatchRouteSessionUseCase,
    private readonly getDispatchRouteUseCase: GetDispatchRouteUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "GET" && isOwnerDispatchRoutePath(pathname)) {
        if (!request.auth?.userId) {
          return {
            statusCode: 401,
            body: { error: "Unauthorized" },
          };
        }

        const dispatchId = extractOwnerDispatchId(pathname);
        const result = await this.getDispatchRouteUseCase.execute({
          dispatchId,
        });

        return {
          statusCode: 200,
          body: mapDispatchRouteResponse(result),
        };
      }

      if (!request.driverAuth?.driverId) {
        return {
          statusCode: 401,
          body: { error: "Unauthorized" },
        };
      }

      if (request.method === "POST" && isDriverStartPath(pathname)) {
        const dispatchId = extractDriverDispatchId(pathname);
        const result = await this.startUseCase.execute({
          dispatchId,
          driverId: request.driverAuth.driverId,
        });

        return {
          statusCode: result.created ? 201 : 200,
          body: {
            created: result.created,
            session: mapSessionResponse(result.session),
          },
        };
      }

      if (request.method === "POST" && isDriverPointsBatchPath(pathname)) {
        const body = toObject(request.body);
        const dispatchId = extractDriverDispatchId(pathname);
        const result = await this.addPointsBatchUseCase.execute({
          dispatchId,
          driverId: request.driverAuth.driverId,
          points: body.points,
        });

        return {
          statusCode: 200,
          body: {
            ok: true,
            ignored: result.ignored,
            sessionId: result.sessionId,
            insertedCount: result.insertedCount,
            lastSequence: result.lastSequence,
          },
        };
      }

      if (request.method === "POST" && isDriverLocationPath(pathname)) {
        const body = toObject(request.body);
        const result = await this.ingestDriverLocationUseCase.execute({
          driverId: request.driverAuth.driverId,
          location: body,
        });

        return {
          statusCode: 200,
          body: {
            ok: true,
            dispatchId: result.dispatchId,
            sessionId: result.sessionId,
            insertedCount: result.insertedCount,
            lastSequence: result.lastSequence,
          },
        };
      }

      if (request.method === "POST" && isDriverStopPath(pathname)) {
        const body = toObject(request.body);
        const dispatchId = extractDriverDispatchId(pathname);
        const result = await this.stopUseCase.execute({
          dispatchId,
          driverId: request.driverAuth.driverId,
          sessionId: body.sessionId,
          endedAt: body.endedAt,
        });

        return {
          statusCode: 200,
          body: {
            ok: true,
            pointsCount: result.pointsCount,
            session: mapSessionResponse(result.session),
          },
        };
      }

      return {
        statusCode: 404,
        body: { error: "Not found" },
      };
    } catch (error) {
      if (error instanceof DispatchRouteInvalidPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof DriverDispatchAccessDeniedError) {
        return {
          statusCode: 403,
          body: {
            error: "Forbidden",
            reason: "DRIVER_DISPATCH_ACCESS_DENIED",
          },
        };
      }

      if (error instanceof DispatchRouteSessionNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Dispatch route session not found",
          },
        };
      }

      if (error instanceof DriverActiveDispatchNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "No active dispatch for driver",
            reason: "ACTIVE_DISPATCH_NOT_FOUND",
          },
        };
      }

      if (error instanceof DispatchRouteSessionClosedError) {
        return {
          statusCode: 409,
          body: {
            error: "Dispatch route session closed",
            reason: "SESSION_ALREADY_CLOSED",
          },
        };
      }

      throw error;
    }
  }
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function isDriverStartPath(pathname: string): boolean {
  return /^\/drivers\/dispatches\/[^/]+\/route\/start$/.test(pathname);
}

function isDriverPointsBatchPath(pathname: string): boolean {
  return /^\/drivers\/dispatches\/[^/]+\/route\/points\/batch$/.test(pathname);
}

function isDriverStopPath(pathname: string): boolean {
  return /^\/drivers\/dispatches\/[^/]+\/route\/stop$/.test(pathname);
}

function isDriverLocationPath(pathname: string): boolean {
  return /^\/drivers\/location$/.test(pathname);
}

function isOwnerDispatchRoutePath(pathname: string): boolean {
  return /^\/dispatches\/[^/]+\/route$/.test(pathname);
}

function extractDriverDispatchId(pathname: string): string {
  const match = pathname.match(/^\/drivers\/dispatches\/([^/]+)\/route(?:\/|$)/);
  return match?.[1] ?? "";
}

function extractOwnerDispatchId(pathname: string): string {
  const match = pathname.match(/^\/dispatches\/([^/]+)\/route$/);
  return match?.[1] ?? "";
}

function mapSessionResponse(session: {
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
}) {
  return {
    id: session.id,
    dispatchId: session.dispatchId,
    driverId: session.driverId,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    totalDistanceMeters: session.totalDistanceMeters,
    durationSeconds: session.durationSeconds,
    polyline: session.polyline,
  };
}

function mapDispatchRouteResponse(result: {
  dispatchId: string;
  sessions: Array<{
    createdAt: Date;
    dispatchId: string;
    driverId: string;
    durationSeconds: number | null;
    endedAt: Date | null;
    id: string;
    points: Array<{
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
    }>;
    polyline: string | null;
    startedAt: Date;
    status: string;
    totalDistanceMeters: number | null;
    updatedAt: Date;
  }>;
}) {
  return {
    dispatchId: result.dispatchId,
    sessions: result.sessions.map((session) => ({
      ...mapSessionResponse(session),
      points: session.points.map((point) => ({
        id: point.id,
        sessionId: point.sessionId,
        sequence: point.sequence,
        createdAt: point.createdAt.toISOString(),
        recordedAt: point.recordedAt.toISOString(),
        lat: point.lat,
        lng: point.lng,
        accuracyMeters: point.accuracyMeters,
        speedMps: point.speedMps,
        headingDegrees: point.headingDegrees,
        altitudeMeters: point.altitudeMeters,
        source: point.source,
        isMocked: point.isMocked,
      })),
    })),
  };
}
