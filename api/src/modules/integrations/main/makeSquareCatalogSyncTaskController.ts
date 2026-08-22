import { PrismaSquareCatalogSyncTaskRepository } from "../infrastructure/prisma/PrismaSquareCatalogSyncTaskRepository.js";
import { SquareCatalogSyncTaskController } from "../presentation/controllers/SquareCatalogSyncTaskController.js";

export function makeSquareCatalogSyncTaskController() {
  return new SquareCatalogSyncTaskController(
    new PrismaSquareCatalogSyncTaskRepository(),
  );
}
