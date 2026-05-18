import { randomUUID } from "node:crypto";
import type { PreparationTaskRepository } from "../../application/ports/PreparationTaskRepository.js";
import type {
  HttpController,
  HttpRequest,
  HttpResponse,
} from "../../../../shared/http/types.js";

export class PreparationTaskController implements HttpController {
  constructor(private readonly repository: PreparationTaskRepository) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, "http://localhost");
    const pathname = url.pathname;

    if (!request.auth?.userId) {
      return { statusCode: 401, body: { error: "Unauthorized" } };
    }

    // Categories
    const isListStationsPath =
      pathname === "/preparation-task-stations" ||
      pathname === "/preparation-task-categories";
    if (request.method === "GET" && isListStationsPath) {
      const completed = parseOptionalBoolean(url.searchParams.get("completed"));
      if (completed === "INVALID") {
        return invalidPayload("completed");
      }

      const items = await this.repository.listCategories({
        orderId: parseOptionalString(url.searchParams.get("orderId")),
        stationId: parseOptionalString(url.searchParams.get("stationId")),
        completed: typeof completed === "boolean" ? completed : undefined,
      });

      return { statusCode: 200, body: { items } };
    }

    const taskStationId =
      extractPathId(pathname, "/preparation-task-stations/") ??
      extractPathId(pathname, "/preparation-task-categories/");
    if (request.method === "GET" && taskStationId) {
      const item = await this.repository.findCategoryById(taskStationId);
      if (!item) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: item };
    }

    const isCreateStationsPath =
      pathname === "/preparation-task-stations" ||
      pathname === "/preparation-task-categories";
    if (request.method === "POST" && isCreateStationsPath) {
      const body = toObject(request.body);
      const orderId = parseRequiredString(body.orderId, "orderId");
      if (!orderId) return invalidPayload("orderId");
      const stationId = parseRequiredString(body.stationId, "stationId");
      if (!stationId) return invalidPayload("stationId");

      const completed = parseBodyOptionalBoolean(body.completed, "completed");
      if (completed === "INVALID") return invalidPayload("completed");

      const item = await this.repository.createCategory({
        id: parseOptionalStringFromUnknown(body.id) ?? randomUUID(),
        orderId,
        stationId,
        completed: typeof completed === "boolean" ? completed : undefined,
      });

      return { statusCode: 201, body: item };
    }

    if (request.method === "PATCH" && taskStationId) {
      const body = toObject(request.body);
      const completed = parseBodyOptionalBoolean(body.completed, "completed");
      if (completed === "INVALID") return invalidPayload("completed");

      const hasAnyField =
        body.stationId !== undefined ||
        body.completed !== undefined;
      if (!hasAnyField) return invalidPayload("body");

      const item = await this.repository.updateCategory({
        id: taskStationId,
        stationId:
          body.stationId !== undefined
            ? parseRequiredString(body.stationId, "stationId") ?? undefined
            : undefined,
        completed: typeof completed === "boolean" ? completed : undefined,
      });

      if (!item) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: item };
    }

    if (request.method === "DELETE" && taskStationId) {
      const ok = await this.repository.deleteCategory(taskStationId);
      if (!ok) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: { ok: true } };
    }

    // Tasks
    if (request.method === "GET" && pathname === "/preparation-tasks") {
      const completed = parseOptionalBoolean(url.searchParams.get("completed"));
      if (completed === "INVALID") {
        return invalidPayload("completed");
      }

      const items = await this.repository.listTasks({
        orderId: parseOptionalString(url.searchParams.get("orderId")),
        stationId: parseOptionalString(url.searchParams.get("stationId")),
        preparationTaskStationId:
          parseOptionalString(url.searchParams.get("preparationTaskStationId")) ??
          parseOptionalString(url.searchParams.get("preparationStepCategoryId")),
        completed: typeof completed === "boolean" ? completed : undefined,
      });

      return { statusCode: 200, body: { items } };
    }

    const taskId = extractPathId(pathname, "/preparation-tasks/");
    if (request.method === "GET" && taskId) {
      const item = await this.repository.findTaskById(taskId);
      if (!item) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: item };
    }

    if (request.method === "POST" && pathname === "/preparation-tasks") {
      const body = toObject(request.body);
      const preparationTaskStationId = parseRequiredString(
        body.preparationTaskStationId ?? body.preparationStepCategoryId,
        "preparationTaskStationId",
      );
      if (!preparationTaskStationId) return invalidPayload("preparationTaskStationId");

      const preparationStepId = parseRequiredString(
        body.preparationStepId,
        "preparationStepId",
      );
      if (!preparationStepId) return invalidPayload("preparationStepId");

      const quantity = parseOptionalInteger(body.quantity);
      if (quantity === "INVALID") return invalidPayload("quantity");
      const completed = parseBodyOptionalBoolean(body.completed, "completed");
      if (completed === "INVALID") return invalidPayload("completed");
      const completedComments = parseBodyOptionalBoolean(
        body.completedComments,
        "completedComments",
      );
      if (completedComments === "INVALID") return invalidPayload("completedComments");
      const goalMinutes = parseOptionalInteger(body.goalMinutes);
      if (goalMinutes === "INVALID") return invalidPayload("goalMinutes");
      const expectedAt = parseOptionalDate(body.expectedAt);
      if (expectedAt === "INVALID") return invalidPayload("expectedAt");

      const modifiers = parseModifiers(body.modifiers);
      if (modifiers === "INVALID") return invalidPayload("modifiers");

      try {
        const item = await this.repository.createTask({
          id: parseOptionalStringFromUnknown(body.id) ?? randomUUID(),
          preparationTaskStationId,
          preparationStepId,
          quantity: quantity ?? undefined,
          comments: parseNullableStringFromUnknown(body.comments),
          completed: typeof completed === "boolean" ? completed : undefined,
          completedComments:
            typeof completedComments === "boolean" ? completedComments : undefined,
          goalMinutes: goalMinutes ?? undefined,
          expectedAt: expectedAt ?? undefined,
          modifiers: modifiers ?? undefined,
        });

        return { statusCode: 201, body: item };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "PREPARATION_STEP_NOT_FOUND") {
            return invalidPayload("preparationStepId");
          }
          if (error.message === "PREPARATION_TASK_CATEGORY_NOT_FOUND") {
            return invalidPayload("preparationTaskStationId");
          }
        }
        throw error;
      }
    }

    if (request.method === "PATCH" && taskId) {
      const body = toObject(request.body);

      const quantity = parseOptionalInteger(body.quantity);
      if (quantity === "INVALID") return invalidPayload("quantity");
      const completed = parseBodyOptionalBoolean(body.completed, "completed");
      if (completed === "INVALID") return invalidPayload("completed");
      const completedComments = parseBodyOptionalBoolean(
        body.completedComments,
        "completedComments",
      );
      if (completedComments === "INVALID") return invalidPayload("completedComments");
      const goalMinutes = parseOptionalInteger(body.goalMinutes);
      if (goalMinutes === "INVALID") return invalidPayload("goalMinutes");
      const expectedAt = parseOptionalDate(body.expectedAt);
      if (expectedAt === "INVALID") return invalidPayload("expectedAt");
      const modifiers = parseModifiers(body.modifiers);
      if (modifiers === "INVALID") return invalidPayload("modifiers");

      const hasAnyField =
        body.quantity !== undefined ||
        body.comments !== undefined ||
        body.completed !== undefined ||
        body.completedComments !== undefined ||
        body.goalMinutes !== undefined ||
        body.expectedAt !== undefined ||
        body.modifiers !== undefined;
      if (!hasAnyField) return invalidPayload("body");

      const item = await this.repository.updateTask({
        id: taskId,
        quantity: quantity ?? undefined,
        comments:
          body.comments !== undefined
            ? parseNullableStringFromUnknown(body.comments)
            : undefined,
        completed: typeof completed === "boolean" ? completed : undefined,
        completedComments:
          typeof completedComments === "boolean" ? completedComments : undefined,
        goalMinutes: goalMinutes ?? undefined,
        expectedAt: expectedAt ?? undefined,
        modifiers: modifiers ?? undefined,
      });

      if (!item) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: item };
    }

    if (request.method === "DELETE" && taskId) {
      const ok = await this.repository.deleteTask(taskId);
      if (!ok) return { statusCode: 404, body: { error: "Not found" } };
      return { statusCode: 200, body: { ok: true } };
    }

    return { statusCode: 404, body: { error: "Not found" } };
  }
}

function invalidPayload(field: string): HttpResponse {
  return { statusCode: 400, body: { error: "Invalid payload", field } };
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function extractPathId(pathname: string, prefix: string): string | null {
  if (!pathname.startsWith(prefix)) return null;
  const raw = pathname.slice(prefix.length).trim();
  if (!raw || raw.includes("/")) return null;
  return raw;
}

function parseOptionalString(value: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function parseRequiredString(value: unknown, _field: string): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function parseOptionalStringFromUnknown(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function parseNullableStringFromUnknown(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function parseOptionalBoolean(value: string | null): boolean | "INVALID" | undefined {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return "INVALID";
}

function parseBodyOptionalBoolean(
  value: unknown,
  _field: string,
): boolean | "INVALID" | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") return "INVALID";
  return value;
}

function parseOptionalInteger(value: unknown): number | null | "INVALID" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return "INVALID";
  }
  return value;
}

function parseOptionalDate(value: unknown): string | null | "INVALID" | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return "INVALID";
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "INVALID";
  return parsed.toISOString();
}

function parseModifiers(
  value: unknown,
):
  | Array<{
      completed?: boolean;
      id: string;
      modifierGroupItemId: string;
    }>
  | "INVALID"
  | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return "INVALID";

  const parsed = [] as Array<{
    completed?: boolean;
    id: string;
    modifierGroupItemId: string;
  }>;

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return "INVALID";
    const row = item as Record<string, unknown>;
    const id = parseRequiredString(row.id, "modifiers.id");
    const modifierGroupItemId = parseRequiredString(
      row.modifierGroupItemId,
      "modifiers.modifierGroupItemId",
    );
    if (!id || !modifierGroupItemId) return "INVALID";

    const completed = parseBodyOptionalBoolean(row.completed, "modifiers.completed");
    if (completed === "INVALID") return "INVALID";

    parsed.push({
      id,
      modifierGroupItemId,
      ...(typeof completed === "boolean" ? { completed } : {}),
    });
  }

  return parsed;
}
