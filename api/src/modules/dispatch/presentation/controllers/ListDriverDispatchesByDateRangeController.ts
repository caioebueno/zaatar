import { InvalidDispatchListPayloadError } from "../../application/errors/InvalidDispatchListPayloadError.js";
import type { ListDriverDispatchesByDateRangeUseCase } from "../../application/use-cases/ListDriverDispatchesByDateRangeUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class ListDriverDispatchesByDateRangeController implements HttpController {
  constructor(
    private readonly useCase: ListDriverDispatchesByDateRangeUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const driverId = request.driverAuth?.driverId;
    if (!driverId) {
      return {
        statusCode: 401,
        body: {
          error: "Unauthorized",
        },
      };
    }

    try {
      const url = new URL(request.path, "http://localhost");
      const result = await this.useCase.execute({
        driverId,
        startDate:
          url.searchParams.get("startDate") ?? url.searchParams.get("start"),
        endDate: url.searchParams.get("endDate") ?? url.searchParams.get("end"),
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof InvalidDispatchListPayloadError) {
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
