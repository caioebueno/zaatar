import type { ForwardLegacyWebApiUseCase } from "../../application/use-cases/ForwardLegacyWebApiUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class ForwardLegacyWebApiController implements HttpController {
  constructor(private readonly forwardLegacyWebApiUseCase: ForwardLegacyWebApiUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const method = normalizeMethod(request.method);

    const result = await this.forwardLegacyWebApiUseCase.execute({
      method,
      path: request.path,
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
