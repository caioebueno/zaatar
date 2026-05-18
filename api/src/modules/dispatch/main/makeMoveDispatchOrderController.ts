import { MoveDispatchOrderUseCase } from "../application/use-cases/MoveDispatchOrderUseCase.js";
import { PrismaDispatchRepository } from "../infrastructure/prisma/PrismaDispatchRepository.js";
import { MoveDispatchOrderController } from "../presentation/controllers/MoveDispatchOrderController.js";

export function makeMoveDispatchOrderController() {
  const repository = new PrismaDispatchRepository();
  const useCase = new MoveDispatchOrderUseCase(repository);
  return new MoveDispatchOrderController(useCase);
}
