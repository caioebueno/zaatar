import { PublishSquareMenusUseCase } from "../application/use-cases/PublishSquareMenusUseCase.js";
import { ProcessSquareCatalogSyncTasksUseCase } from "../application/use-cases/ProcessSquareCatalogSyncTasksUseCase.js";
import { HttpSquareCatalogGateway } from "../infrastructure/http/HttpSquareCatalogGateway.js";
import { SquareConnectionAccessTokenResolver } from "../infrastructure/http/SquareConnectionAccessTokenResolver.js";
import { PrismaSquareCatalogSyncTaskRepository } from "../infrastructure/prisma/PrismaSquareCatalogSyncTaskRepository.js";
import { PrismaSquareConnectionRepository } from "../infrastructure/prisma/PrismaSquareConnectionRepository.js";

let activeRun: Promise<void> | null = null;
let rerunRequested = false;

export function triggerSquareCatalogSyncTaskProcessing(limit = 5): void {
  if (activeRun) {
    rerunRequested = true;
    return;
  }

  const repository = new PrismaSquareCatalogSyncTaskRepository();
  const squareConnectionRepository = new PrismaSquareConnectionRepository();
  const squareTokenResolver = new SquareConnectionAccessTokenResolver(
    squareConnectionRepository,
  );
  const publishSquareMenusUseCase = new PublishSquareMenusUseCase(
    new HttpSquareCatalogGateway(),
  );
  const useCase = new ProcessSquareCatalogSyncTasksUseCase(
    repository,
    squareTokenResolver,
    publishSquareMenusUseCase,
  );

  activeRun = runUntilQueueDrains(useCase, limit)
    .catch((error) => {
      console.error("[square-catalog-sync-task] background processing failed:", error);
    })
    .finally(() => {
      activeRun = null;
      if (rerunRequested) {
        rerunRequested = false;
        triggerSquareCatalogSyncTaskProcessing(limit);
      }
    });
}

async function runUntilQueueDrains(
  useCase: ProcessSquareCatalogSyncTasksUseCase,
  limit: number,
): Promise<void> {
  while (true) {
    const result = await useCase.execute({ limit });
    const handledCount = result.processed + result.failed + result.skipped;

    if (handledCount < limit) {
      return;
    }
  }
}
