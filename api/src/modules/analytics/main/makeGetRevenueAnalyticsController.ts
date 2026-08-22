import { GetRevenueAnalyticsUseCase } from "../application/use-cases/GetRevenueAnalyticsUseCase.js";
import { PrismaAnalyticsRepository } from "../infrastructure/prisma/PrismaAnalyticsRepository.js";
import { GetRevenueAnalyticsController } from "../presentation/controllers/GetRevenueAnalyticsController.js";

export function makeGetRevenueAnalyticsController() {
  const repository = new PrismaAnalyticsRepository();
  const useCase = new GetRevenueAnalyticsUseCase(repository);
  return new GetRevenueAnalyticsController(useCase);
}
