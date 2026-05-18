import { GetCurrentBusinessUseCase } from "../application/use-cases/GetCurrentBusinessUseCase.js";
import { PrismaBusinessRepository } from "../infrastructure/prisma/PrismaBusinessRepository.js";
import { GetCurrentBusinessController } from "../presentation/controllers/GetCurrentBusinessController.js";

export function makeGetCurrentBusinessController() {
  const repository = new PrismaBusinessRepository();
  const useCase = new GetCurrentBusinessUseCase(repository);
  return new GetCurrentBusinessController(useCase);
}

