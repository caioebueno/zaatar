import { InvalidDispatchListPayloadError } from "../../application/errors/InvalidDispatchListPayloadError.js";
import type { ListDispatchesUseCase } from "../../application/use-cases/ListDispatchesUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class ListDispatchesController implements HttpController {
  constructor(private readonly useCase: ListDispatchesUseCase) {}

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
      const url = new URL(request.path, "http://localhost");
      const statusRaw = url.searchParams.get("status");

      const result = await this.useCase.execute({
        filters: {
          status: statusRaw ?? undefined,
        },
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
