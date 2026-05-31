import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { InvalidUpsertOrderIntentPayloadError } from "../../application/errors/InvalidUpsertOrderIntentPayloadError.js";
import { OrderIntentCustomerNotFoundError } from "../../application/errors/OrderIntentCustomerNotFoundError.js";
import { OrderIntentDeliveryAddressNotFoundError } from "../../application/errors/OrderIntentDeliveryAddressNotFoundError.js";
import { OrderIntentBranchNotFoundError } from "../../application/errors/OrderIntentBranchNotFoundError.js";
import { OrderIntentNotFoundError } from "../../application/errors/OrderIntentNotFoundError.js";
import type { UpsertOrderIntentUseCase } from "../../application/use-cases/UpsertOrderIntentUseCase.js";

export class OrderIntentController implements HttpController {
  constructor(private readonly upsertOrderIntentUseCase: UpsertOrderIntentUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "POST" && pathname === "/order-intents/upsert") {
        const body = toObject(request.body);
        console.log("[api] order-intents/upsert body:", body);
        const result = await this.upsertOrderIntentUseCase.execute({
          id: body.id,
          branchId: body.branchId,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          active: body.active,
          language: body.language,
          status: body.status,
          type: body.type,
          paymentMethod: body.paymentMethod,
          paymentProvider: body.paymentProvider,
          tipAmount: body.tipAmount,
          tags: body.tags,
          progressiveDiscountSnapshot: body.progressiveDiscountSnapshot,
          amount: body.amount,
          deliveryAddress: body.deliveryAddress,
          deliveryAddressId: body.deliveryAddressId,
          orderProducts: body.orderProducts,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      return {
        statusCode: 404,
        body: {
          error: "Not found",
        },
      };
    } catch (error) {
      if (error instanceof InvalidUpsertOrderIntentPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof OrderIntentCustomerNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Customer not found",
          },
        };
      }

      if (error instanceof OrderIntentNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Order intent not found",
          },
        };
      }

      if (error instanceof OrderIntentDeliveryAddressNotFoundError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: "deliveryAddress",
            reason: "DELIVERY_ADDRESS_NOT_FOUND_OR_UNSUPPORTED",
          },
        };
      }
      if (error instanceof OrderIntentBranchNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Branch not found",
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
