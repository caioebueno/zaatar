import { EmailAlreadyRegisteredError } from "../../application/errors/EmailAlreadyRegisteredError.js";
import { InvalidPayloadError } from "../../application/errors/InvalidPayloadError.js";
import type { RegisterOwnerUseCase } from "../../application/use-cases/RegisterOwnerUseCase.js";
import type { HttpController, HttpRequest, HttpResponse } from "../../../../shared/http/types.js";

export class RegisterOwnerController implements HttpController {
  constructor(private readonly registerOwnerUseCase: RegisterOwnerUseCase) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const body = toObject(request.body);

      const result = await this.registerOwnerUseCase.execute({
        name: body.name,
        email: body.email,
        password: body.password,
      });

      return {
        statusCode: 201,
        body: {
          ok: true,
          owner: result.owner,
        },
      };
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        return {
          statusCode: 409,
          body: {
            error: "Email already registered",
            field: "email",
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
