import { ListFeedbackUseCase } from "../application/use-cases/ListFeedbackUseCase.js";
import { PrismaFeedbackRepository } from "../infrastructure/prisma/PrismaFeedbackRepository.js";
import { ListFeedbackController } from "../presentation/controllers/ListFeedbackController.js";

export function makeListFeedbackController() {
  const repository = new PrismaFeedbackRepository();
  const useCase = new ListFeedbackUseCase(repository);
  return new ListFeedbackController(useCase);
}
