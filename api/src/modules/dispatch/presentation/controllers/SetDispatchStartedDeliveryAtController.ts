import { DispatchNotFoundError } from "../../application/errors/DispatchNotFoundError.js";
import { DriverDispatchPermissionDeniedError } from "../../application/errors/DriverDispatchPermissionDeniedError.js";
import { InvalidDispatchStartedDeliveryPayloadError } from "../../application/errors/InvalidDispatchStartedDeliveryPayloadError.js";
import type { SetDispatchStartedDeliveryAtUseCase } from "../../application/use-cases/SetDispatchStartedDeliveryAtUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class SetDispatchStartedDeliveryAtController implements HttpController {
  constructor(private readonly useCase: SetDispatchStartedDeliveryAtUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.driverAuth?.driverId) {
      return {
        statusCode: 401,
        body: {
          error: "Unauthorized",
        },
      };
    }

    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;
    const dispatchId = extractDispatchId(pathname);

    try {
      const body = toObject(request.body);

      const result = await this.useCase.execute({
        dispatchId,
        driverId: request.driverAuth.driverId,
        startedDeliveryAt: body.startedDeliveryAt,
      });

      return {
        statusCode: 200,
        body: {
          ok: true,
          dispatchId: result.dispatchId,
          startedDeliveryAt: result.startedDeliveryAt,
        },
      };
    } catch (error) {
      if (error instanceof InvalidDispatchStartedDeliveryPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof DispatchNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Dispatch not found",
          },
        };
      }

      if (error instanceof DriverDispatchPermissionDeniedError) {
        return {
          statusCode: 403,
          body: {
            error: "Forbidden",
            reason: "DRIVER_DISPATCH_ACCESS_DENIED",
          },
        };
      }

      throw error;
    }
  }
}

function extractDispatchId(pathname: string): string {
  const match = pathname.match(/^\/drivers\/dispatches\/([^/]+)\/started-delivery$/);
  return match?.[1] ?? "";
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

