import { ListOrdersV1UseCase } from "../application/use-cases/ListOrdersV1UseCase.js";
import { PrismaOrdersRepository } from "../infrastructure/prisma/PrismaOrdersRepository.js";
import { ListOrdersV1Controller } from "../presentation/controllers/ListOrdersV1Controller.js";

export function makeListOrdersV1Controller() {
  const repository = new PrismaOrdersRepository();
  const useCase = new ListOrdersV1UseCase(repository);
  return new ListOrdersV1Controller(useCase);
}
