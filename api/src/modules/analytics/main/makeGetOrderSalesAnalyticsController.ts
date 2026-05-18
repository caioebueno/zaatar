import { GetOrderSalesAnalyticsUseCase } from "../application/use-cases/GetOrderSalesAnalyticsUseCase.js";
import { PrismaAnalyticsRepository } from "../infrastructure/prisma/PrismaAnalyticsRepository.js";
import { GetOrderSalesAnalyticsController } from "../presentation/controllers/GetOrderSalesAnalyticsController.js";

export function makeGetOrderSalesAnalyticsController() {
  const repository = new PrismaAnalyticsRepository();
  const useCase = new GetOrderSalesAnalyticsUseCase(repository);
  return new GetOrderSalesAnalyticsController(useCase);
}
