import { ListOwnedBusinessesUseCase } from "../application/use-cases/ListOwnedBusinessesUseCase.js";
import { PrismaBusinessRepository } from "../infrastructure/prisma/PrismaBusinessRepository.js";
import { ListOwnedBusinessesController } from "../presentation/controllers/ListOwnedBusinessesController.js";

export function makeListOwnedBusinessesController() {
  const repository = new PrismaBusinessRepository();
  const useCase = new ListOwnedBusinessesUseCase(repository);
  return new ListOwnedBusinessesController(useCase);
}
