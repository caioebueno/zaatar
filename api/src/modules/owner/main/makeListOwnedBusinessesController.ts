import { ListOwnedBusinessesUseCase } from "../application/use-cases/ListOwnedBusinessesUseCase.js";
import { PrismaOwnerRepository } from "../infrastructure/prisma/PrismaOwnerRepository.js";
import { ListOwnedBusinessesController } from "../presentation/controllers/ListOwnedBusinessesController.js";

export function makeListOwnedBusinessesController() {
  const repository = new PrismaOwnerRepository();
  const useCase = new ListOwnedBusinessesUseCase(repository);
  return new ListOwnedBusinessesController(useCase);
}
