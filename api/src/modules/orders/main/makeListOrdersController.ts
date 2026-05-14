import { ListOrdersUseCase } from "../application/use-cases/ListOrdersUseCase.js";
import { PrismaOrdersRepository } from "../infrastructure/prisma/PrismaOrdersRepository.js";
import { ListOrdersController } from "../presentation/controllers/ListOrdersController.js";

export function makeListOrdersController() {
  const repository = new PrismaOrdersRepository();
  const useCase = new ListOrdersUseCase(repository);
  return new ListOrdersController(useCase);
}
