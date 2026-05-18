import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type { GetOrdersByStationUseCase } from "../../application/use-cases/GetOrdersByStationUseCase.js";

export class GetOrdersByStationController implements HttpController {
  constructor(private readonly useCase: GetOrdersByStationUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const stationId = url.searchParams.get("stationId")?.trim() ?? "";

    if (!stationId) {
      return {
        statusCode: 400,
        body: {
          error: "Missing stationId",
        },
      };
    }

    const items = await this.useCase.execute({
      stationId,
    });

    return {
      statusCode: 200,
      body: items,
    };
  }
}
