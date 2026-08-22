import prisma from "../../../../prisma.js";
import type { SquareCatalogSyncTaskRepository } from "../ports/SquareCatalogSyncTaskRepository.js";
import { PublishSquareMenusUseCase } from "./PublishSquareMenusUseCase.js";
import { SquareConnectionAccessTokenResolver } from "../../infrastructure/http/SquareConnectionAccessTokenResolver.js";

type ProcessSquareCatalogSyncTasksInput = {
  limit?: number;
};

export type ProcessSquareCatalogSyncTasksOutput = {
  failed: number;
  processed: number;
  skipped: number;
};

export class ProcessSquareCatalogSyncTasksUseCase {
  constructor(
    private readonly repository: SquareCatalogSyncTaskRepository,
    private readonly squareTokenResolver: SquareConnectionAccessTokenResolver,
    private readonly publishSquareMenusUseCase: PublishSquareMenusUseCase,
  ) {}

  async execute(
    input: ProcessSquareCatalogSyncTasksInput = {},
  ): Promise<ProcessSquareCatalogSyncTasksOutput> {
    const tasks = await this.repository.claimPendingTasks(input.limit ?? 5);

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const task of tasks) {
      try {
        const relatedMenuIds = await loadRelatedMenuIds(task.productId);
        if (relatedMenuIds.length === 0) {
          await this.repository.markTaskCompleted({
            taskId: task.id,
            status: "SKIPPED",
            responsePayload: {
              reason: "PRODUCT_HAS_NO_RELATED_MENU",
            },
          });
          skipped += 1;
          continue;
        }

        const accessToken = await this.squareTokenResolver.resolveForBusiness(
          task.businessId,
        );
        const result = await this.publishSquareMenusUseCase.execute({
          accessToken,
          menuIds: relatedMenuIds,
        });

        if (!result.success) {
          await this.repository.markTaskFailed({
            taskId: task.id,
            errorMessage: extractPublishErrorMessage(result),
            responsePayload: result,
            retryAt: getRetryDate(task.attempts),
          });
          failed += 1;
          continue;
        }

        await this.repository.markTaskCompleted({
          taskId: task.id,
          responsePayload: result,
        });
        processed += 1;
      } catch (error) {
        const errorMessage = toErrorMessage(error);

        if (errorMessage === "SQUARE_NOT_CONNECTED") {
          await this.repository.markTaskCompleted({
            taskId: task.id,
            status: "SKIPPED",
            responsePayload: {
              reason: "SQUARE_NOT_CONNECTED",
            },
          });
          skipped += 1;
          continue;
        }

        await this.repository.markTaskFailed({
          taskId: task.id,
          errorMessage,
          responsePayload: {
            error: errorMessage,
          },
          retryAt: getRetryDate(task.attempts),
        });
        failed += 1;
      }
    }

    return {
      failed,
      processed,
      skipped,
    };
  }
}

async function loadRelatedMenuIds(productId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ menuId: string | null }>>`
    SELECT DISTINCT source."menuId" AS "menuId"
    FROM (
      SELECT category."menuId"
      FROM "Product" product
      INNER JOIN "Category" category ON category."id" = product."categoryId"
      WHERE product."id" = ${productId}

      UNION

      SELECT category."menuId"
      FROM "ProductCategory" product_category
      INNER JOIN "Category" category ON category."id" = product_category."categoryId"
      WHERE product_category."productId" = ${productId}

      UNION

      SELECT menu_category."menuId"
      FROM "ProductCategory" product_category
      INNER JOIN "MenuCategory" menu_category
        ON menu_category."categoryId" = product_category."categoryId"
      WHERE product_category."productId" = ${productId}
    ) source
    WHERE source."menuId" IS NOT NULL
  `;

  return Array.from(
    new Set(
      rows
        .map((row) => row.menuId?.trim() ?? "")
        .filter((menuId) => menuId.length > 0),
    ),
  );
}

function extractPublishErrorMessage(result: {
  menus: Array<{ error?: string; success: boolean }>;
}): string {
  const firstError = result.menus.find((menu) => !menu.success)?.error?.trim();
  return firstError || "SQUARE_CATALOG_SYNC_FAILED";
}

function getRetryDate(attempts: number): Date {
  const delayInSeconds = Math.min(30 * 2 ** Math.max(attempts - 1, 0), 15 * 60);
  return new Date(Date.now() + delayInSeconds * 1000);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown Square catalog sync task error";
  }
}
