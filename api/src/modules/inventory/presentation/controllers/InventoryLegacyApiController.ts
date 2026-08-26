import type { ForwardLegacyWebApiUseCase } from "../../../catalog/application/use-cases/ForwardLegacyWebApiUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class InventoryLegacyApiController implements HttpController {
  constructor(
    private readonly forwardLegacyWebApiUseCase: ForwardLegacyWebApiUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const method = normalizeMethod(request.method);

    const result = await this.forwardLegacyWebApiUseCase.execute({
      method,
      path: normalizeInventoryPath(request.path),
      body: request.body,
      rawBody: request.rawBody,
      headers: request.headers,
    });

    return {
      statusCode: result.statusCode,
      body: result.body,
    };
  }
}

function normalizeMethod(value: string): "GET" | "POST" | "PATCH" | "DELETE" {
  if (
    value === "GET" ||
    value === "POST" ||
    value === "PATCH" ||
    value === "DELETE"
  ) {
    return value;
  }

  throw new Error(`Unsupported method: ${value}`);
}

function normalizeInventoryPath(path: string): string {
  const url = new URL(path, "http://localhost");
  const pathname = url.pathname.startsWith("/api/inventory")
    ? url.pathname.slice("/api".length)
    : url.pathname;

  return `${pathname}${url.search}`;
}
