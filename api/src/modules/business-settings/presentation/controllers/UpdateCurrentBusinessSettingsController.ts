import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { BusinessContextRequiredError } from "../../application/errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../../application/errors/BusinessNotFoundError.js";
import { InvalidBusinessSettingsPayloadError } from "../../application/errors/InvalidBusinessSettingsPayloadError.js";
import type { UpdateCurrentBusinessSettingsUseCase } from "../../application/use-cases/UpdateCurrentBusinessSettingsUseCase.js";

export class UpdateCurrentBusinessSettingsController implements HttpController {
  constructor(private readonly useCase: UpdateCurrentBusinessSettingsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const body =
        request.body && typeof request.body === "object" && !Array.isArray(request.body)
          ? (request.body as Record<string, unknown>)
          : {};

      const result = await this.useCase.execute({
        businessId: request.auth?.businessId,
        name: body.name,
        brandColor: body.brandColor,
        logoUrl: body.logoUrl,
        bannerPhotoUrl: body.bannerPhotoUrl,
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

      if (error instanceof InvalidBusinessSettingsPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
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
