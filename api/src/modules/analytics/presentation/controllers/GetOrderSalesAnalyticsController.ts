import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { InvalidAnalyticsRangeError } from "../../application/errors/InvalidAnalyticsRangeError.js";
import type { GetOrderSalesAnalyticsUseCase } from "../../application/use-cases/GetOrderSalesAnalyticsUseCase.js";

export class GetOrderSalesAnalyticsController implements HttpController {
  constructor(private readonly useCase: GetOrderSalesAnalyticsUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const url = new URL(request.path, "http://localhost");

      const result = await this.useCase.execute({
        from: url.searchParams.get("from") ?? undefined,
        to: url.searchParams.get("to") ?? undefined,
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
