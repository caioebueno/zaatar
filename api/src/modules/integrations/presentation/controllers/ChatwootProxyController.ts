import type { HttpController, HttpRequest, HttpResponse } from "../../../../shared/http/types.js";
import { BranchChatwootConfigMissingError } from "../../application/errors/BranchChatwootConfigMissingError.js";
import { BranchNotFoundForConversationError } from "../../application/errors/BranchNotFoundForConversationError.js";
import { ChatwootProxyConfigError } from "../../application/errors/ChatwootProxyConfigError.js";
import { ChatwootProxyRequestError } from "../../application/errors/ChatwootProxyRequestError.js";
import { InvalidChatwootChatsQueryError } from "../../application/errors/InvalidChatwootChatsQueryError.js";
import type { ListChatwootConversationMessagesUseCase } from "../../application/use-cases/ListChatwootConversationMessagesUseCase.js";
import type { ListChatwootChatsUseCase } from "../../application/use-cases/ListChatwootChatsUseCase.js";
import type { SendChatwootConversationMessageUseCase } from "../../application/use-cases/SendChatwootConversationMessageUseCase.js";
import type { TakeCareChatwootConversationUseCase } from "../../application/use-cases/TakeCareChatwootConversationUseCase.js";
import type { ResolveChatwootConversationUseCase } from "../../application/use-cases/ResolveChatwootConversationUseCase.js";
import type { MarkChatwootConversationReadUseCase } from "../../application/use-cases/MarkChatwootConversationReadUseCase.js";

export class ChatwootProxyController implements HttpController {
  constructor(
    private readonly listChatwootChatsUseCase: ListChatwootChatsUseCase,
    private readonly listChatwootConversationMessagesUseCase: ListChatwootConversationMessagesUseCase,
    private readonly sendChatwootConversationMessageUseCase: SendChatwootConversationMessageUseCase,
    private readonly takeCareChatwootConversationUseCase: TakeCareChatwootConversationUseCase,
    private readonly resolveChatwootConversationUseCase: ResolveChatwootConversationUseCase,
    private readonly markChatwootConversationReadUseCase: MarkChatwootConversationReadUseCase,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    if (!request.auth?.userId) {
      return {
        statusCode: 401,
        body: { error: "Unauthorized" },
      };
    }

    if (request.method === "GET" && pathname === "/conversation") {
      try {
        const query = Object.fromEntries(url.searchParams.entries());
        const result = await this.listChatwootChatsUseCase.execute({
          businessId: request.auth.businessId ?? undefined,
          query,
        });

        return {
          statusCode: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof InvalidChatwootChatsQueryError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
            },
          };
        }

        if (error instanceof ChatwootProxyConfigError) {
          return {
            statusCode: 503,
            body: {
              error: "CHATWOOT_NOT_CONFIGURED",
              field: error.field,
            },
          };
        }

        if (error instanceof BranchNotFoundForConversationError) {
          return {
            statusCode: 404,
            body: {
              error: "Branch not found",
              field: "branchId",
            },
          };
        }

        if (error instanceof BranchChatwootConfigMissingError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
              reason: "BRANCH_CHATWOOT_CONFIG_MISSING",
            },
          };
        }

        if (error instanceof ChatwootProxyRequestError) {
          return {
            statusCode: error.statusCode,
            body: {
              error: "CHATWOOT_REQUEST_FAILED",
              statusCode: error.statusCode,
              response: error.responseBody,
            },
          };
        }

        throw error;
      }
    }

    if (
      request.method === "GET" &&
      /^\/conversation\/[^/]+\/messages$/.test(pathname)
    ) {
      try {
        const query = Object.fromEntries(url.searchParams.entries());
        const pathParts = pathname.split("/").filter(Boolean);
        const conversationId = decodeURIComponent(pathParts[1] ?? "").trim();
        const result =
          await this.listChatwootConversationMessagesUseCase.execute({
            businessId: request.auth.businessId ?? undefined,
            conversationId,
            query,
          });

        return {
          statusCode: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof InvalidChatwootChatsQueryError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
            },
          };
        }

        if (error instanceof ChatwootProxyConfigError) {
          return {
            statusCode: 503,
            body: {
              error: "CHATWOOT_NOT_CONFIGURED",
              field: error.field,
            },
          };
        }

        if (error instanceof BranchNotFoundForConversationError) {
          return {
            statusCode: 404,
            body: {
              error: "Branch not found",
              field: "branchId",
            },
          };
        }

        if (error instanceof BranchChatwootConfigMissingError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
              reason: "BRANCH_CHATWOOT_CONFIG_MISSING",
            },
          };
        }

        if (error instanceof ChatwootProxyRequestError) {
          return {
            statusCode: error.statusCode,
            body: {
              error: "CHATWOOT_REQUEST_FAILED",
              statusCode: error.statusCode,
              response: error.responseBody,
            },
          };
        }

        throw error;
      }
    }

    if (
      request.method === "POST" &&
      /^\/conversation\/[^/]+\/messages$/.test(pathname)
    ) {
      try {
        const query = Object.fromEntries(url.searchParams.entries());
        const pathParts = pathname.split("/").filter(Boolean);
        const conversationId = decodeURIComponent(pathParts[1] ?? "").trim();
        const result = await this.sendChatwootConversationMessageUseCase.execute(
          {
            businessId: request.auth.businessId ?? undefined,
            body: request.body,
            conversationId,
            query,
          },
        );

        return {
          statusCode: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof InvalidChatwootChatsQueryError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
            },
          };
        }

        if (error instanceof ChatwootProxyConfigError) {
          return {
            statusCode: 503,
            body: {
              error: "CHATWOOT_NOT_CONFIGURED",
              field: error.field,
            },
          };
        }

        if (error instanceof BranchNotFoundForConversationError) {
          return {
            statusCode: 404,
            body: {
              error: "Branch not found",
              field: "branchId",
            },
          };
        }

        if (error instanceof BranchChatwootConfigMissingError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
              reason: "BRANCH_CHATWOOT_CONFIG_MISSING",
            },
          };
        }

        if (error instanceof ChatwootProxyRequestError) {
          return {
            statusCode: error.statusCode,
            body: {
              error: "CHATWOOT_REQUEST_FAILED",
              statusCode: error.statusCode,
              response: error.responseBody,
            },
          };
        }

        throw error;
      }
    }

    if (
      request.method === "POST" &&
      /^\/conversation\/[^/]+\/take-care$/.test(pathname)
    ) {
      try {
        const query = Object.fromEntries(url.searchParams.entries());
        const pathParts = pathname.split("/").filter(Boolean);
        const conversationId = decodeURIComponent(pathParts[1] ?? "").trim();
        const result = await this.takeCareChatwootConversationUseCase.execute({
          businessId: request.auth.businessId ?? undefined,
          conversationId,
          query,
        });

        return {
          statusCode: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof InvalidChatwootChatsQueryError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
            },
          };
        }

        if (error instanceof ChatwootProxyConfigError) {
          return {
            statusCode: 503,
            body: {
              error: "CHATWOOT_NOT_CONFIGURED",
              field: error.field,
            },
          };
        }

        if (error instanceof BranchNotFoundForConversationError) {
          return {
            statusCode: 404,
            body: {
              error: "Branch not found",
              field: "branchId",
            },
          };
        }

        if (error instanceof BranchChatwootConfigMissingError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
              reason: "BRANCH_CHATWOOT_CONFIG_MISSING",
            },
          };
        }

        if (error instanceof ChatwootProxyRequestError) {
          return {
            statusCode: error.statusCode,
            body: {
              error: "CHATWOOT_REQUEST_FAILED",
              statusCode: error.statusCode,
              response: error.responseBody,
            },
          };
        }

        throw error;
      }
    }

    if (
      request.method === "POST" &&
      /^\/conversation\/[^/]+\/resolve$/.test(pathname)
    ) {
      try {
        const query = Object.fromEntries(url.searchParams.entries());
        const pathParts = pathname.split("/").filter(Boolean);
        const conversationId = decodeURIComponent(pathParts[1] ?? "").trim();
        const result =
          await this.resolveChatwootConversationUseCase.execute({
            businessId: request.auth.businessId ?? undefined,
            conversationId,
            query,
          });

        return {
          statusCode: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof InvalidChatwootChatsQueryError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
            },
          };
        }

        if (error instanceof ChatwootProxyConfigError) {
          return {
            statusCode: 503,
            body: {
              error: "CHATWOOT_NOT_CONFIGURED",
              field: error.field,
            },
          };
        }

        if (error instanceof BranchNotFoundForConversationError) {
          return {
            statusCode: 404,
            body: {
              error: "Branch not found",
              field: "branchId",
            },
          };
        }

        if (error instanceof BranchChatwootConfigMissingError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
              reason: "BRANCH_CHATWOOT_CONFIG_MISSING",
            },
          };
        }

        if (error instanceof ChatwootProxyRequestError) {
          return {
            statusCode: error.statusCode,
            body: {
              error: "CHATWOOT_REQUEST_FAILED",
              statusCode: error.statusCode,
              response: error.responseBody,
            },
          };
        }

        throw error;
      }
    }

    if (
      request.method === "POST" &&
      /^\/conversation\/[^/]+\/read$/.test(pathname)
    ) {
      try {
        const query = Object.fromEntries(url.searchParams.entries());
        const pathParts = pathname.split("/").filter(Boolean);
        const conversationId = decodeURIComponent(pathParts[1] ?? "").trim();
        const result =
          await this.markChatwootConversationReadUseCase.execute({
            businessId: request.auth.businessId ?? undefined,
            conversationId,
            query,
          });

        return {
          statusCode: 200,
          body: result,
        };
      } catch (error) {
        if (error instanceof InvalidChatwootChatsQueryError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
            },
          };
        }

        if (error instanceof ChatwootProxyConfigError) {
          return {
            statusCode: 503,
            body: {
              error: "CHATWOOT_NOT_CONFIGURED",
              field: error.field,
            },
          };
        }

        if (error instanceof BranchNotFoundForConversationError) {
          return {
            statusCode: 404,
            body: {
              error: "Branch not found",
              field: "branchId",
            },
          };
        }

        if (error instanceof BranchChatwootConfigMissingError) {
          return {
            statusCode: 400,
            body: {
              error: "Invalid payload",
              field: error.field,
              reason: "BRANCH_CHATWOOT_CONFIG_MISSING",
            },
          };
        }

        if (error instanceof ChatwootProxyRequestError) {
          return {
            statusCode: error.statusCode,
            body: {
              error: "CHATWOOT_REQUEST_FAILED",
              statusCode: error.statusCode,
              response: error.responseBody,
            },
          };
        }

        throw error;
      }
    }

    return {
      statusCode: 404,
      body: { error: "Not found" },
    };
  }
}
