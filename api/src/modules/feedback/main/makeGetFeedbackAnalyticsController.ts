import { GetFeedbackAnalyticsUseCase } from "../application/use-cases/GetFeedbackAnalyticsUseCase.js";
import { PrismaFeedbackRepository } from "../infrastructure/prisma/PrismaFeedbackRepository.js";
import { GetFeedbackAnalyticsController } from "../presentation/controllers/GetFeedbackAnalyticsController.js";

export function makeGetFeedbackAnalyticsController() {
  const repository = new PrismaFeedbackRepository();
  const useCase = new GetFeedbackAnalyticsUseCase(repository);
  return new GetFeedbackAnalyticsController(useCase);
}
