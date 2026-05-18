import { SetDispatchStartedDeliveryAtUseCase } from "../application/use-cases/SetDispatchStartedDeliveryAtUseCase.js";
import { PrismaDispatchRepository } from "../infrastructure/prisma/PrismaDispatchRepository.js";
import { SetDispatchStartedDeliveryAtController } from "../presentation/controllers/SetDispatchStartedDeliveryAtController.js";

export function makeSetDispatchStartedDeliveryAtController() {
  const repository = new PrismaDispatchRepository();
  const useCase = new SetDispatchStartedDeliveryAtUseCase(repository);

  return new SetDispatchStartedDeliveryAtController(useCase);
}

