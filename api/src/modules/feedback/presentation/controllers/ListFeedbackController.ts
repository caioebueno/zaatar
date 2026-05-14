import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { InvalidFeedbackListQueryError } from "../../application/errors/InvalidFeedbackListQueryError.js";
import type { ListFeedbackUseCase } from "../../application/use-cases/ListFeedbackUseCase.js";

export class ListFeedbackController implements HttpController {
  constructor(private readonly useCase: ListFeedbackUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const url = new URL(request.path, "http://localhost");
      const from = url.searchParams.get("from")?.trim() || undefined;
      const to = url.searchParams.get("to")?.trim() || undefined;
      const timezone = url.searchParams.get("timezone")?.trim() || undefined;
      const sentiment = url.searchParams.get("sentiment")?.trim() || undefined;
      const limitRaw = url.searchParams.get("limit")?.trim() || "";
      const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

      const result = await this.useCase.execute({
        from,
        to,
        timezone,
        sentiment,
        limit,
      });

      return {
        statusCode: 200,
        body: result,
      };
    } catch (error) {
      if (error instanceof InvalidFeedbackListQueryError) {
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
