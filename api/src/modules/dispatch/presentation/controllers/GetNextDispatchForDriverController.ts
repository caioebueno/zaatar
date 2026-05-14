import { InvalidDispatchNextPayloadError } from "../../application/errors/InvalidDispatchNextPayloadError.js";
import type { GetNextDispatchForDriverUseCase } from "../../application/use-cases/GetNextDispatchForDriverUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class GetNextDispatchForDriverController implements HttpController {
  constructor(private readonly useCase: GetNextDispatchForDriverUseCase) {}

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
      const result = await this.useCase.execute({ driverId });
      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof InvalidDispatchNextPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid driverId",
            field: error.field,
          },
        };
      }

      throw error;
    }
  }
}
