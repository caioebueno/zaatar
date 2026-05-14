import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type { GetOrderByIdUseCase } from "../../application/use-cases/GetOrderByIdUseCase.js";

export class GetOrderByIdController implements HttpController {
  constructor(private readonly useCase: GetOrderByIdUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;
    const orderId = decodeURIComponent(pathname.slice("/orders/".length)).trim();

    if (!orderId) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "orderId" },
      };
    }

    const result = await this.useCase.execute({ orderId });
    if (!result) {
      return {
        statusCode: 404,
        body: { error: "Order not found" },
      };
    }

    return {
      statusCode: 200,
      body: result,
    };
  }
}
