import { GetNextDispatchForDriverUseCase } from "../application/use-cases/GetNextDispatchForDriverUseCase.js";
import { PrismaDispatchRepository } from "../infrastructure/prisma/PrismaDispatchRepository.js";
import { GetNextDispatchForDriverController } from "../presentation/controllers/GetNextDispatchForDriverController.js";

export function makeGetNextDispatchForDriverController() {
  const repository = new PrismaDispatchRepository();
  const useCase = new GetNextDispatchForDriverUseCase(repository);

  return new GetNextDispatchForDriverController(useCase);
}
