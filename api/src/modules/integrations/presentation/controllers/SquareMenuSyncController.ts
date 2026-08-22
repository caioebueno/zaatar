import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type { SquareConnectionAccessTokenResolver } from "../../infrastructure/http/SquareConnectionAccessTokenResolver.js";
import type { PublishSquareMenusUseCase } from "../../application/use-cases/PublishSquareMenusUseCase.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export class SquareMenuSyncController implements HttpController {
  constructor(
    private readonly publishSquareMenusUseCase: PublishSquareMenusUseCase,
    private readonly squareTokenResolver: SquareConnectionAccessTokenResolver,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    if (!request.auth?.userId) {
      return {
        statusCode: 401,
        body: { error: "Unauthorized" },
      };
    }

    const businessId = request.auth.businessId?.trim() ?? "";
    if (!businessId) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload", field: "businessId" },
      };
    }

    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    if (request.method !== "POST" || pathname !== "/integrations/square/menu-sync/publish-all") {
      return {
        statusCode: 404,
        body: { error: "Not found" },
      };
    }

    if (!isRecord(request.body)) {
      return {
        statusCode: 400,
        body: { error: "Invalid payload" },
      };
    }

    const activeOnly = request.body.activeOnly === true;
    const dryRun = request.body.dryRun === true;
    const includeHiddenProducts = request.body.includeHiddenProducts === true;
    const menuIds = parseMenuIds(request.body.menuIds);

    try {
      const accessToken = await this.squareTokenResolver.resolveForBusiness(businessId);
      const result = await this.publishSquareMenusUseCase.execute({
        accessToken,
        activeOnly,
        dryRun,
        includeHiddenProducts,
        menuIds,
      });

      return {
        statusCode: result.success ? 200 : 207,
        body: result,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "SQUARE_NOT_CONNECTED") {
        return {
          statusCode: 400,
          body: { error: "SQUARE_NOT_CONNECTED" },
        };
      }

      if (error instanceof Error && error.message === "SQUARE_ACCESS_TOKEN_NOT_CONFIGURED") {
        return {
          statusCode: 400,
          body: { error: "SQUARE_ACCESS_TOKEN_NOT_CONFIGURED" },
        };
      }

      throw error;
    }
  }
}

function parseMenuIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
