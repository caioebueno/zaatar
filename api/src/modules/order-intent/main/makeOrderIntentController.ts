import { UpsertOrderIntentUseCase } from "../application/use-cases/UpsertOrderIntentUseCase.js";
import { PrismaOrderIntentRepository } from "../infrastructure/prisma/PrismaOrderIntentRepository.js";
import { OrderIntentController } from "../presentation/controllers/OrderIntentController.js";

export function makeOrderIntentController() {
  const repository = new PrismaOrderIntentRepository();
  const useCase = new UpsertOrderIntentUseCase(repository);
  return new OrderIntentController(useCase);
}

