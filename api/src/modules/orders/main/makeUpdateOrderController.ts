import { UpdateOrderDeliveryUseCase } from "../application/use-cases/UpdateOrderDeliveryUseCase.js";
import { PrismaOrdersRepository } from "../infrastructure/prisma/PrismaOrdersRepository.js";
import { UpdateOrderController } from "../presentation/controllers/UpdateOrderController.js";

export function makeUpdateOrderController() {
  const repository = new PrismaOrdersRepository();
  const useCase = new UpdateOrderDeliveryUseCase(repository);
  return new UpdateOrderController(useCase);
}
