import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type { ListOrdersV1UseCase } from "../../application/use-cases/ListOrdersV1UseCase.js";

export class ListOrdersV1Controller implements HttpController {
  constructor(private readonly useCase: ListOrdersV1UseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const from = url.searchParams.get("from")?.trim() || undefined;
    const to = url.searchParams.get("to")?.trim() || undefined;
    const timezone = url.searchParams.get("timezone")?.trim() || undefined;
    const includeCanceled = url.searchParams.get("includeCanceled") === "true";
    const pageRaw = url.searchParams.get("page")?.trim() || "";
    const pageSizeRaw = url.searchParams.get("pageSize")?.trim() || "";

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

    if (pageRaw && !isPositiveInteger(pageRaw)) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "page" },
      };
    }

    if (pageSizeRaw && !isPositiveInteger(pageSizeRaw)) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "pageSize" },
      };
    }

    const result = await this.useCase.execute({
      from,
      to,
      timezone,
      includeCanceled,
      page: pageRaw ? Number.parseInt(pageRaw, 10) : undefined,
      pageSize: pageSizeRaw ? Number.parseInt(pageSizeRaw, 10) : undefined,
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

function isPositiveInteger(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}
