import { GetOrderByIdUseCase } from "../application/use-cases/GetOrderByIdUseCase.js";
import { PrismaOrdersRepository } from "../infrastructure/prisma/PrismaOrdersRepository.js";
import { GetOrderByIdController } from "../presentation/controllers/GetOrderByIdController.js";

export function makeGetOrderByIdController() {
  const repository = new PrismaOrdersRepository();
  const useCase = new GetOrderByIdUseCase(repository);
  return new GetOrderByIdController(useCase);
}
