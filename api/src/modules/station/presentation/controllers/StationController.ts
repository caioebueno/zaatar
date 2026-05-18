import { randomUUID } from "node:crypto";
import { StationBusinessContextRequiredError } from "../../application/errors/StationBusinessContextRequiredError.js";
import type { StationRepository } from "../../application/ports/StationRepository.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function parseBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function parseGoalMinutes(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (!Number.isInteger(value) || value < 0) return undefined;
  return value;
}

function extractStationId(pathname: string): string | null {
  const m = pathname.match(/^\/stations\/([^/]+)$/);
  return m ? m[1] : null;
}

function extractStepIds(pathname: string): { stationId: string; stepId: string } | null {
  const m = pathname.match(/^\/stations\/([^/]+)\/steps\/([^/]+)$/);
  return m ? { stationId: m[1], stepId: m[2] } : null;
}

function isStepsCollectionPath(pathname: string): string | null {
  const m = pathname.match(/^\/stations\/([^/]+)\/steps$/);
  return m ? m[1] : null;
}

function extractCompleteOrderByStationPath(pathname: string): {
  orderId: string;
  stationId: string;
} | null {
  const m = pathname.match(/^\/stations\/([^/]+)\/orders\/([^/]+)\/complete$/);
  return m ? { stationId: m[1], orderId: m[2] } : null;
}

export class StationController implements HttpController {
  constructor(private readonly repository: StationRepository) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    if (!request.auth?.userId) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }

    const businessId = request.auth?.businessId;

    try {
      // GET /stations
      if (request.method === "GET" && pathname === "/stations") {
        if (!businessId) throw new StationBusinessContextRequiredError();
        const items = await this.repository.listStations({ businessId });
        return { statusCode: 200, body: { items } };
      }

      // POST /stations
      if (request.method === "POST" && pathname === "/stations") {
        const body = toObject(request.body);
        const name = parseString(body.name);
        if (!name) {
          return { statusCode: 400, body: { error: "Invalid payload", field: "name" } };
        }
        const station = await this.repository.createStation({ id: randomUUID(), name });
        return { statusCode: 201, body: station };
      }

      // PATCH /stations/:id
      const stationId = extractStationId(pathname);
      if (request.method === "PATCH" && stationId) {
        const body = toObject(request.body);
        const name = parseString(body.name);
        if (!name) {
          return { statusCode: 400, body: { error: "Invalid payload", field: "name" } };
        }
        const station = await this.repository.updateStation({ id: stationId, name });
        if (!station) return { statusCode: 404, body: { error: "Station not found" } };
        return { statusCode: 200, body: station };
      }

      // DELETE /stations/:id
      if (request.method === "DELETE" && stationId) {
        const ok = await this.repository.deleteStation({ id: stationId });
        if (!ok) return { statusCode: 404, body: { error: "Station not found" } };
        return { statusCode: 200, body: { ok: true } };
      }

      // POST /stations/:id/steps
      const stepsStationId = isStepsCollectionPath(pathname);
      if (request.method === "POST" && stepsStationId) {
        const body = toObject(request.body);
        const name = parseString(body.name);
        const goalMinutes = parseGoalMinutes(body.goalMinutes);
        if (!name) {
          return { statusCode: 400, body: { error: "Invalid payload", field: "name" } };
        }
        if (body.goalMinutes !== undefined && goalMinutes === undefined) {
          return {
            statusCode: 400,
            body: { error: "Invalid payload", field: "goalMinutes" },
          };
        }
        const step = await this.repository.createStep({
          id: randomUUID(),
          stationId: stepsStationId,
          name,
          goalMinutes: goalMinutes ?? 0,
          includeComments: parseBool(body.includeComments) ?? false,
          includeModifiers: parseBool(body.includeModifiers) ?? false,
        });
        return { statusCode: 201, body: step };
      }

      // PATCH /stations/:id/steps/:stepId
      const stepIds = extractStepIds(pathname);
      if (request.method === "PATCH" && stepIds) {
        const body = toObject(request.body);
        const goalMinutes = parseGoalMinutes(body.goalMinutes);
        if (body.goalMinutes !== undefined && goalMinutes === undefined) {
          return {
            statusCode: 400,
            body: { error: "Invalid payload", field: "goalMinutes" },
          };
        }
        const step = await this.repository.updateStep({
          id: stepIds.stepId,
          name: parseString(body.name),
          goalMinutes,
          includeComments: parseBool(body.includeComments),
          includeModifiers: parseBool(body.includeModifiers),
        });
        if (!step) return { statusCode: 404, body: { error: "Step not found" } };
        return { statusCode: 200, body: step };
      }

      // POST /stations/:stationId/orders/:orderId/complete
      const completeOrderByStation = extractCompleteOrderByStationPath(pathname);
      if (request.method === "POST" && completeOrderByStation) {
        const result = await this.repository.completeOrderTracksByStation({
          stationId: completeOrderByStation.stationId,
          orderId: completeOrderByStation.orderId,
        });
        return {
          statusCode: 200,
          body: {
            orderId: completeOrderByStation.orderId,
            stationId: completeOrderByStation.stationId,
            ...result,
          },
        };
      }

      // DELETE /stations/:id/steps/:stepId
      if (request.method === "DELETE" && stepIds) {
        const ok = await this.repository.deleteStep({ id: stepIds.stepId });
        if (!ok) return { statusCode: 404, body: { error: "Step not found" } };
        return { statusCode: 200, body: { ok: true } };
      }

      return { statusCode: 404, body: { error: "Not found" } };
    } catch (error) {
      if (error instanceof StationBusinessContextRequiredError) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload", field: "businessId", reason: "BUSINESS_CONTEXT_REQUIRED" },
        };
      }
      throw error;
    }
  }
}
