import { GetNewCustomersAnalyticsUseCase } from "../application/use-cases/GetNewCustomersAnalyticsUseCase.js";
import { PrismaAnalyticsRepository } from "../infrastructure/prisma/PrismaAnalyticsRepository.js";
import { GetNewCustomersAnalyticsController } from "../presentation/controllers/GetNewCustomersAnalyticsController.js";

export function makeGetNewCustomersAnalyticsController() {
  const repository = new PrismaAnalyticsRepository();
  const useCase = new GetNewCustomersAnalyticsUseCase(repository);
  return new GetNewCustomersAnalyticsController(useCase);
}
