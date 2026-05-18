import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { InvalidBusinessPayloadError } from "../../application/errors/InvalidBusinessPayloadError.js";
import type { CreateBusinessUseCase } from "../../application/use-cases/CreateBusinessUseCase.js";
import { StripeNotConfiguredError } from "../../../onboarding/application/errors/StripeNotConfiguredError.js";
import { StripeRequestFailedError } from "../../../onboarding/application/errors/StripeRequestFailedError.js";

export class CreateBusinessController implements HttpController {
  constructor(private readonly useCase: CreateBusinessUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.auth?.userId) {
      return {
        statusCode: 401,
        body: {
          error: "Unauthorized",
        },
      };
    }

    try {
      const body =
        request.body && typeof request.body === "object" && !Array.isArray(request.body)
          ? (request.body as Record<string, unknown>)
          : {};

      const result = await this.useCase.execute({
        userId: request.auth.userId,
        ownerEmail: request.auth.email,
        name: body.name,
        logoUrl: body.logoUrl,
      });

      return {
        statusCode: 201,
        body: result,
      };
    } catch (error) {
      if (error instanceof InvalidBusinessPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof StripeNotConfiguredError) {
        return {
          statusCode: 503,
          body: {
            error: "Stripe not configured",
            reason: "STRIPE_NOT_CONFIGURED",
          },
        };
      }

      if (error instanceof StripeRequestFailedError) {
        return {
          statusCode: 502,
          body: {
            error: "Stripe request failed",
            reason: "STRIPE_REQUEST_FAILED",
            message: error.message,
            statusCode: error.statusCode,
          },
        };
      }

      throw error;
    }
  }
}
