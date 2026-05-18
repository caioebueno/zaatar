import { DriverOrderPermissionDeniedError } from "../../application/errors/DriverOrderPermissionDeniedError.js";
import { InvalidUpdateOrderPayloadError } from "../../application/errors/InvalidUpdateOrderPayloadError.js";
import { OrderNotFoundError } from "../../application/errors/OrderNotFoundError.js";
import type { UpdateOrderDeliveryUseCase } from "../../application/use-cases/UpdateOrderDeliveryUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class UpdateOrderController implements HttpController {
  constructor(private readonly useCase: UpdateOrderDeliveryUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;
    const orderId = extractOrderId(pathname);
    const body = toObject(request.body);

    try {
      const result = await this.useCase.execute({
        orderId,
        deliveredAt: body.deliveredAt,
        driverId: request.driverAuth?.driverId,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof InvalidUpdateOrderPayloadError) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload", field: error.field },
        };
      }

      if (error instanceof OrderNotFoundError) {
        return {
          statusCode: 404,
          body: { error: "Order not found" },
        };
      }

      if (error instanceof DriverOrderPermissionDeniedError) {
        return {
          statusCode: 403,
          body: {
            error: "Forbidden",
            reason: "DRIVER_ORDER_PERMISSION_DENIED",
          },
        };
      }

      throw error;
    }
  }
}

function extractOrderId(pathname: string): string {
  const managerMatch = pathname.match(/^\/orders\/([^/]+)$/);
  if (managerMatch?.[1]) {
    return decodeURIComponent(managerMatch[1]).trim();
  }

  const driverMatch = pathname.match(/^\/drivers\/orders\/([^/]+)$/);
  if (driverMatch?.[1]) {
    return decodeURIComponent(driverMatch[1]).trim();
  }

  return "";
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
