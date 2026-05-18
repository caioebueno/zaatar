import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type { ListOwnedBusinessesUseCase } from "../../application/use-cases/ListOwnedBusinessesUseCase.js";

export class ListOwnedBusinessesController implements HttpController {
  constructor(private readonly useCase: ListOwnedBusinessesUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.auth?.userId) {
      return {
        statusCode: 401,
        body: { error: "Unauthorized" },
      };
    }

    const result = await this.useCase.execute({
      userId: request.auth.userId,
    });

    return {
      statusCode: 200,
      body: result,
    };
  }
}
