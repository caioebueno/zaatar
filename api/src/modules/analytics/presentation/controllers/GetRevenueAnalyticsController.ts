import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { InvalidAnalyticsRangeError } from "../../application/errors/InvalidAnalyticsRangeError.js";
import type { GetRevenueAnalyticsUseCase } from "../../application/use-cases/GetRevenueAnalyticsUseCase.js";

export class GetRevenueAnalyticsController implements HttpController {
  constructor(private readonly useCase: GetRevenueAnalyticsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const url = new URL(request.path, "http://localhost");

      const result = await this.useCase.execute({
        businessId: request.auth?.businessId ?? undefined,
        startDate: url.searchParams.get("startDate") ?? undefined,
        endDate: url.searchParams.get("endDate") ?? undefined,
        compareStartDate: url.searchParams.get("compareStartDate") ?? undefined,
        timezone: url.searchParams.get("timezone") ?? undefined,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof InvalidAnalyticsRangeError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      throw error;
    }
  }
}
