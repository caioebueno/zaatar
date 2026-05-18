import { ListDispatchesUseCase } from "../application/use-cases/ListDispatchesUseCase.js";
import { PrismaDispatchRepository } from "../infrastructure/prisma/PrismaDispatchRepository.js";
import { ListDispatchesController } from "../presentation/controllers/ListDispatchesController.js";

export function makeListDispatchesController() {
  const repository = new PrismaDispatchRepository();
  const useCase = new ListDispatchesUseCase(repository);

  return new ListDispatchesController(useCase);
}
