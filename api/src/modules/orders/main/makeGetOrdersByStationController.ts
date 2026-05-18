import { GetOrdersByStationUseCase } from "../application/use-cases/GetOrdersByStationUseCase.js";
import { PrismaOrdersRepository } from "../infrastructure/prisma/PrismaOrdersRepository.js";
import { GetOrdersByStationController } from "../presentation/controllers/GetOrdersByStationController.js";

export function makeGetOrdersByStationController() {
  const repository = new PrismaOrdersRepository();
  const useCase = new GetOrdersByStationUseCase(repository);
  return new GetOrdersByStationController(useCase);
}
