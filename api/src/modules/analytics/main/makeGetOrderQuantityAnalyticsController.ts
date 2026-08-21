import { GetOrderQuantityAnalyticsUseCase } from "../application/use-cases/GetOrderQuantityAnalyticsUseCase.js";
import { PrismaAnalyticsRepository } from "../infrastructure/prisma/PrismaAnalyticsRepository.js";
import { GetOrderQuantityAnalyticsController } from "../presentation/controllers/GetOrderQuantityAnalyticsController.js";

export function makeGetOrderQuantityAnalyticsController() {
  const repository = new PrismaAnalyticsRepository();
  const useCase = new GetOrderQuantityAnalyticsUseCase(repository);
  return new GetOrderQuantityAnalyticsController(useCase);
}
