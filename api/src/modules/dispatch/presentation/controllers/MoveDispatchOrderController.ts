import { DispatchNotFoundError } from "../../application/errors/DispatchNotFoundError.js";
import { InvalidDispatchUpdatePayloadError } from "../../application/errors/InvalidDispatchUpdatePayloadError.js";
import { OrderNotFoundError } from "../../application/errors/OrderNotFoundError.js";
import type { MoveDispatchOrderUseCase } from "../../application/use-cases/MoveDispatchOrderUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class MoveDispatchOrderController implements HttpController {
  constructor(private readonly useCase: MoveDispatchOrderUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;
    const orderId = extractOrderId(pathname);
    const body = toObject(request.body);

    try {
      const result = await this.useCase.execute({
        orderId,
        createNewDispatch: body.createNewDispatch,
        targetDispatchId: body.targetDispatchId,
        targetIndex: body.targetIndex,
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

      if (error instanceof OrderNotFoundError) {
        return {
          statusCode: 404,
          body: { error: "Order not found" },
        };
      }

      if (error instanceof DispatchNotFoundError) {
        return {
          statusCode: 404,
          body: { error: "Target dispatch not found" },
        };
      }

      throw error;
    }
  }
}

function extractOrderId(pathname: string): string {
  const match = pathname.match(/^\/dispatches\/orders\/([^/]+)$/);
  return decodeURIComponent(match?.[1] ?? "").trim();
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
