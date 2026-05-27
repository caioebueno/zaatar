import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { InvalidChatwootWebhookPayloadError } from "../../application/errors/InvalidChatwootWebhookPayloadError.js";
import type { HandleChatwootWebhookUseCase } from "../../application/use-cases/HandleChatwootWebhookUseCase.js";
import type { RegisterOwnerIosPushTokenUseCase } from "../../application/use-cases/RegisterOwnerIosPushTokenUseCase.js";

export class ChatwootWebhookController implements HttpController {
  constructor(
    private readonly handleWebhookUseCase: HandleChatwootWebhookUseCase,
    private readonly registerOwnerIosPushTokenUseCase: RegisterOwnerIosPushTokenUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    try {
      if (request.method === "POST" && pathname === "/webhooks/chatwoot") {
        const result = await this.handleWebhookUseCase.execute({
          rawBody: request.rawBody ?? Buffer.from("{}"),
          signature: request.headers?.["x-chatwoot-signature"] ?? null,
          token: request.headers?.["x-chatwoot-token"] ?? null,
        });

        return {
          statusCode: 200,
          body: {
            ok: true,
            ...result,
          },
        };
      }

      if (
        request.method === "POST" &&
        pathname === "/owners/me/push-devices/ios"
      ) {
        if (!request.auth?.userId) {
          return {
            statusCode: 401,
            body: { error: "Unauthorized" },
          };
        }

        const result = await this.registerOwnerIosPushTokenUseCase.execute({
          userId: request.auth.userId,
          businessId: request.auth.businessId ?? null,
          body: request.body,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      return {
        statusCode: 404,
        body: { error: "Not found" },
      };
    } catch (error) {
      if (error instanceof InvalidChatwootWebhookPayloadError) {
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
