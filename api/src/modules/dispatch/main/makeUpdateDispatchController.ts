import { UpdateDispatchUseCase } from "../application/use-cases/UpdateDispatchUseCase.js";
import { PrismaDispatchRepository } from "../infrastructure/prisma/PrismaDispatchRepository.js";
import { UpdateDispatchController } from "../presentation/controllers/UpdateDispatchController.js";

export function makeUpdateDispatchController() {
  const repository = new PrismaDispatchRepository();
  const useCase = new UpdateDispatchUseCase(repository);
  return new UpdateDispatchController(useCase);
}
