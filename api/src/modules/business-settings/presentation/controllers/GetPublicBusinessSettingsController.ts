import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { BusinessContextRequiredError } from "../../application/errors/BusinessContextRequiredError.js";
import { BusinessNotFoundError } from "../../application/errors/BusinessNotFoundError.js";
import type { GetCurrentBusinessSettingsUseCase } from "../../application/use-cases/GetCurrentBusinessSettingsUseCase.js";

const BUSINESS_ID_HEADER_NAME = "x-business-id";

export class GetPublicBusinessSettingsController implements HttpController {
  constructor(private readonly useCase: GetCurrentBusinessSettingsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const businessId = this.readBusinessId(request);
      const result = await this.useCase.execute({
        businessId,
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

  private readBusinessId(request: HttpRequest): string | null {
    const fromHeader = request.headers?.[BUSINESS_ID_HEADER_NAME]?.trim();
    if (fromHeader) return fromHeader;

    try {
      const parsed = new URL(request.path, "http://localhost");
      const fromQuery = parsed.searchParams.get("businessId")?.trim();
      return fromQuery || null;
    } catch {
      return null;
    }
  }
}

