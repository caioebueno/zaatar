import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import { BusinessAccessDeniedError } from "../../application/errors/BusinessAccessDeniedError.js";
import { BusinessContextRequiredError } from "../../application/errors/BusinessContextRequiredError.js";
import { InvalidBusinessPayloadError } from "../../application/errors/InvalidBusinessPayloadError.js";
import type { AddCurrentBusinessMemberUseCase } from "../../application/use-cases/AddCurrentBusinessMemberUseCase.js";
import type { ListCurrentBusinessMembersUseCase } from "../../application/use-cases/ListCurrentBusinessMembersUseCase.js";

export class BusinessMembersController implements HttpController {
  constructor(
    private readonly listUseCase: ListCurrentBusinessMembersUseCase,
    private readonly addUseCase: AddCurrentBusinessMemberUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.auth?.userId) {
      return {
        statusCode: 401,
        body: { error: "Unauthorized" },
      };
    }

    try {
      if (request.method === "GET") {
        const result = await this.listUseCase.execute({
          businessId: request.auth.businessId,
        });

        return {
          statusCode: 200,
          body: result,
        };
      }

      if (request.method === "POST") {
        const body =
          request.body && typeof request.body === "object" && !Array.isArray(request.body)
            ? (request.body as Record<string, unknown>)
            : {};

        const result = await this.addUseCase.execute({
          actorRole: request.auth.businessRole,
          businessId: request.auth.businessId,
          email: body.email,
          name: body.name,
          phone: body.phone,
          role: body.role,
          userId: request.auth.userId,
        });

        return {
          statusCode: 201,
          body: result,
        };
      }

      return {
        statusCode: 405,
        body: { error: "Method not allowed" },
      };
    } catch (error) {
      if (error instanceof BusinessContextRequiredError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: "businessId",
            reason: "BUSINESS_CONTEXT_REQUIRED",
          },
        };
      }

      if (error instanceof InvalidBusinessPayloadError) {
        return {
          statusCode: 400,
          body: {
            error: "Invalid payload",
            field: error.field,
          },
        };
      }

      if (error instanceof BusinessAccessDeniedError) {
        return {
          statusCode: 403,
          body: {
            error: "Forbidden",
            reason: "BUSINESS_ACCESS_DENIED",
          },
        };
      }

      throw error;
    }
  }
}
