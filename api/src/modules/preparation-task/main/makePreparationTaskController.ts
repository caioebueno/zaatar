import { PrismaPreparationTaskRepository } from "../infrastructure/prisma/PrismaPreparationTaskRepository.js";
import { PreparationTaskController } from "../presentation/controllers/PreparationTaskController.js";

export function makePreparationTaskController(): PreparationTaskController {
  const repository = new PrismaPreparationTaskRepository();
  return new PreparationTaskController(repository);
}
