import { GetCustomerRetentionAnalyticsUseCase } from "../application/use-cases/GetCustomerRetentionAnalyticsUseCase.js";
import { PrismaAnalyticsRepository } from "../infrastructure/prisma/PrismaAnalyticsRepository.js";
import { GetCustomerRetentionAnalyticsController } from "../presentation/controllers/GetCustomerRetentionAnalyticsController.js";

export function makeGetCustomerRetentionAnalyticsController() {
  const repository = new PrismaAnalyticsRepository();
  const useCase = new GetCustomerRetentionAnalyticsUseCase(repository);
  return new GetCustomerRetentionAnalyticsController(useCase);
}
