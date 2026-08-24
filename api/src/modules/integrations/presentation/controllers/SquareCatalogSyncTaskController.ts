import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";
import type {
  SquareCatalogSyncTaskRepository,
  SquareCatalogSyncTaskView,
} from "../../application/ports/SquareCatalogSyncTaskRepository.js";

export class SquareCatalogSyncTaskController implements HttpController {
  constructor(
    private readonly repository: SquareCatalogSyncTaskRepository,
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

    if (
      request.method === "GET" &&
      pathname.startsWith("/integrations/square/catalog-sync-tasks/")
    ) {
      const taskId = decodeURIComponent(
        pathname.slice("/integrations/square/catalog-sync-tasks/".length),
      ).trim();

      if (!taskId) {
        return {
          statusCode: 400,
          body: { error: "Invalid payload", field: "taskId" },
        };
      }

      const task = await this.repository.findById({
        businessId,
        taskId,
      });

      if (!task) {
        return {
          statusCode: 404,
          body: { error: "SQUARE_CATALOG_SYNC_TASK_NOT_FOUND" },
        };
      }

      return {
        statusCode: 200,
        body: {
          task: serializeTask(task),
        },
      };
    }

    if (request.method === "GET" && pathname === "/integrations/square/catalog-sync-tasks") {
      const limit = parseLimit(url.searchParams.get("limit"));
      const menuId = url.searchParams.get("menuId")?.trim() || undefined;
      const productId = url.searchParams.get("productId")?.trim() || undefined;
      const tasks = await this.repository.listTasks({
        businessId,
        limit,
        menuId,
        productId,
      });

      return {
        statusCode: 200,
        body: {
          tasks: tasks.map(serializeTask),
          menuId: menuId ?? null,
          productId: productId ?? null,
          limit,
        },
      };
    }

    return {
      statusCode: 404,
      body: { error: "Not found" },
    };
  }
}

function parseLimit(rawValue: string | null): number {
  const parsed = Number.parseInt(rawValue?.trim() ?? "", 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.min(parsed, 100);
}

function serializeTask(task: SquareCatalogSyncTaskView) {
  return {
    id: task.id,
    productId: task.productId,
    menuId: task.menuId,
    taskType: task.taskType,
    status: task.status,
    isRunning: task.status === "PENDING" || task.status === "PROCESSING",
    attempts: task.attempts,
    availableAt: task.availableAt.toISOString(),
    processingStartedAt: task.processingStartedAt?.toISOString() ?? null,
    finishedAt: task.finishedAt?.toISOString() ?? null,
    errorMessage: task.errorMessage,
    requestPayload: task.requestPayload ?? null,
    responsePayload: task.responsePayload ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
