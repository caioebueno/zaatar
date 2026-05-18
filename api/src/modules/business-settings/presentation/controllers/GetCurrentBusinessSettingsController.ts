import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { BusinessContextRequiredError } from "../../application/errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../../application/errors/BusinessNotFoundError.js";
import type { GetCurrentBusinessSettingsUseCase } from "../../application/use-cases/GetCurrentBusinessSettingsUseCase.js";

export class GetCurrentBusinessSettingsController implements HttpController {
  constructor(private readonly useCase: GetCurrentBusinessSettingsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const result = await this.useCase.execute({
        businessId: request.auth?.businessId,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof BusinessContextRequiredError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: "businessId",
            reason: "BUSINESS_CONTEXT_REQUIRED",
          },
        };
      }

      if (error instanceof BusinessNotFoundError) {
        return {
          statusCode: 404,
          body: {
            error: "Business not found",
          },
        };
      }

      throw error;
    }
  }
}
