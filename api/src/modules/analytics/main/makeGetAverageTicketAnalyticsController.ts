import { GetAverageTicketAnalyticsUseCase } from "../application/use-cases/GetAverageTicketAnalyticsUseCase.js";
import { PrismaAnalyticsRepository } from "../infrastructure/prisma/PrismaAnalyticsRepository.js";
import { GetAverageTicketAnalyticsController } from "../presentation/controllers/GetAverageTicketAnalyticsController.js";

export function makeGetAverageTicketAnalyticsController() {
  const repository = new PrismaAnalyticsRepository();
  const useCase = new GetAverageTicketAnalyticsUseCase(repository);
  return new GetAverageTicketAnalyticsController(useCase);
}
