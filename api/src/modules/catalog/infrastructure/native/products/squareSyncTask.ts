import type { SquareCatalogSyncTaskView } from "../../../../integrations/application/ports/SquareCatalogSyncTaskRepository.js";

export type ProductSquareSyncTaskResponse = {
  attempts: number;
  availableAt: string;
  createdAt: string;
  errorMessage: string | null;
  finishedAt: string | null;
  id: string;
  processingStartedAt: string | null;
  status: SquareCatalogSyncTaskView["status"];
  taskType: SquareCatalogSyncTaskView["taskType"];
  updatedAt: string;
};

export function mapSquareSyncTask(
  task: SquareCatalogSyncTaskView | null | undefined,
): ProductSquareSyncTaskResponse | null {
  if (!task) {
    return null;
  }

  return {
    id: task.id,
    taskType: task.taskType,
    status: task.status,
    attempts: task.attempts,
    availableAt: task.availableAt.toISOString(),
    processingStartedAt: task.processingStartedAt?.toISOString() ?? null,
    finishedAt: task.finishedAt?.toISOString() ?? null,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
