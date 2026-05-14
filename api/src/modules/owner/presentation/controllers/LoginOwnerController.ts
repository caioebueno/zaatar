import { InvalidCredentialsError } from "../../application/errors/InvalidCredentialsError.js";
import { InvalidPayloadError } from "../../application/errors/InvalidPayloadError.js";
import type { LoginOwnerUseCase } from "../../application/use-cases/LoginOwnerUseCase.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class LoginOwnerController implements HttpController {
  constructor(private readonly loginOwnerUseCase: LoginOwnerUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const body = toObject(request.body);

      const result = await this.loginOwnerUseCase.execute({
        email: body.email,
        password: body.password,
      });

      return {
        statusCode: 200,
        body: {
          ok: true,
          accessToken: result.token.accessToken,
          expiresAt: result.token.expiresAt.toISOString(),
          owner: result.user,
          businesses: result.businesses,
          selectedBusinessId: result.selectedBusinessId,
        },
      };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return {
          statusCode: 401,
          body: {
            error: "Invalid email or password",
          },
        };
      }

      if (error instanceof InvalidPayloadError) {
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

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
