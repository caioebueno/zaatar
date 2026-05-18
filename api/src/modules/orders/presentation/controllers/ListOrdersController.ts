import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type { ListOrdersUseCase } from "../../application/use-cases/ListOrdersUseCase.js";

export class ListOrdersController implements HttpController {
  constructor(private readonly useCase: ListOrdersUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const from = url.searchParams.get("from")?.trim() || undefined;
    const to = url.searchParams.get("to")?.trim() || undefined;
    const timezone = url.searchParams.get("timezone")?.trim() || undefined;
    const includeCanceled = url.searchParams.get("includeCanceled") === "true";
    const limitRaw = url.searchParams.get("limit")?.trim() || "";
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

    if (from && !isDateOnly(from)) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "from" },
      };
    }

    if (to && !isDateOnly(to)) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "to" },
      };
    }

    const result = await this.useCase.execute({
      from,
      to,
      timezone,
      includeCanceled,
      limit,
    });

    return {
      statusCode: 200,
      body: result,
    };
  }
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
