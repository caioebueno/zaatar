export type SquareCatalogSyncTaskStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "SKIPPED";

export type SquareCatalogSyncTaskType = "PRODUCT_UPDATE";

export type SquareCatalogSyncTaskView = {
  attempts: number;
  availableAt: Date;
  businessId: string;
  createdAt: Date;
  errorMessage: string | null;
  finishedAt: Date | null;
  id: string;
  processingStartedAt: Date | null;
  productId: string;
  requestPayload: unknown;
  responsePayload: unknown;
  status: SquareCatalogSyncTaskStatus;
  taskType: SquareCatalogSyncTaskType;
  updatedAt: Date;
};

export interface SquareCatalogSyncTaskRepository {
  claimPendingTasks(limit: number): Promise<SquareCatalogSyncTaskView[]>;
  createProductUpdateTask(input: {
    businessId: string;
    productId: string;
    requestPayload?: unknown;
  }): Promise<SquareCatalogSyncTaskView>;
  findById(input: {
    businessId: string;
    taskId: string;
  }): Promise<SquareCatalogSyncTaskView | null>;
  findLatestForProducts(input: {
    businessId: string;
    productIds: string[];
  }): Promise<Map<string, SquareCatalogSyncTaskView>>;
  listTasks(input: {
    businessId: string;
    limit: number;
    productId?: string;
  }): Promise<SquareCatalogSyncTaskView[]>;
  markTaskCompleted(input: {
    responsePayload?: unknown;
    status?: Extract<SquareCatalogSyncTaskStatus, "SKIPPED" | "SUCCESS">;
    taskId: string;
  }): Promise<void>;
  markTaskFailed(input: {
    errorMessage: string;
    responsePayload?: unknown;
    retryAt?: Date;
    taskId: string;
  }): Promise<void>;
}
