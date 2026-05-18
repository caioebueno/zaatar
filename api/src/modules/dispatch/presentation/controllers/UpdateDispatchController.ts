import { DispatchNotFoundError } from "../../application/errors/DispatchNotFoundError.js";
import { DriverNotFoundError } from "../../application/errors/DriverNotFoundError.js";
import { InvalidDispatchUpdatePayloadError } from "../../application/errors/InvalidDispatchUpdatePayloadError.js";
import type { UpdateDispatchUseCase } from "../../application/use-cases/UpdateDispatchUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class UpdateDispatchController implements HttpController {
  constructor(private readonly useCase: UpdateDispatchUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;
    const dispatchId = extractDispatchId(pathname);
    const body = toObject(request.body);

    try {
      const parsedDispatchAt = parseDispatchAtAlias(body);
      const result = await this.useCase.execute({
        dispatchId,
        dispatched: body.dispatched,
        dispatchAt: parsedDispatchAt,
        driverId: body.driverId,
        queueIndex: body.queueIndex,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof InvalidDispatchUpdatePayloadError) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload", field: error.field },
        };
      }

      if (error instanceof DispatchNotFoundError) {
        return {
          statusCode: 404,
          body: { error: "Dispatch not found" },
        };
      }

      if (error instanceof DriverNotFoundError) {
        return {
          statusCode: 404,
          body: { error: "Driver not found" },
        };
      }

      throw error;
    }
  }
}

function extractDispatchId(pathname: string): string {
  const match = pathname.match(/^\/dispatches\/([^/]+)$/);
  return match?.[1] ?? "";
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseDispatchAtAlias(
  body: Record<string, unknown>,
): unknown {
  if (
    body.dispatchAt !== undefined &&
    body.dispatchedAt !== undefined &&
    body.dispatchAt !== body.dispatchedAt
  ) {
    throw new InvalidDispatchUpdatePayloadError("dispatchAt");
  }

  if (body.dispatchAt !== undefined) {
    return body.dispatchAt;
  }

  return body.dispatchedAt;
}
