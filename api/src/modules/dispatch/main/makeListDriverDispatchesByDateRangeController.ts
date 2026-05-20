import { ListDriverDispatchesByDateRangeUseCase } from "../application/use-cases/ListDriverDispatchesByDateRangeUseCase.js";
import { PrismaDispatchRepository } from "../infrastructure/prisma/PrismaDispatchRepository.js";
import { ListDriverDispatchesByDateRangeController } from "../presentation/controllers/ListDriverDispatchesByDateRangeController.js";

export function makeListDriverDispatchesByDateRangeController() {
  const repository = new PrismaDispatchRepository();
  const useCase = new ListDriverDispatchesByDateRangeUseCase(repository);

  return new ListDriverDispatchesByDateRangeController(useCase);
}
