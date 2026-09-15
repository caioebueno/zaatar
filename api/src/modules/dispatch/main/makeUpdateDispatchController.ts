import { UpdateDispatchUseCase } from "../application/use-cases/UpdateDispatchUseCase.js";
import { DispatchWhatsAppJobScheduler } from "../infrastructure/prisma/DispatchWhatsAppJobScheduler.js";
import { PrismaDispatchRepository } from "../infrastructure/prisma/PrismaDispatchRepository.js";
import { UpdateDispatchController } from "../presentation/controllers/UpdateDispatchController.js";

export function makeUpdateDispatchController() {
  const repository = new PrismaDispatchRepository();
  const outForDeliveryNotifier = new DispatchWhatsAppJobScheduler();
  const useCase = new UpdateDispatchUseCase(repository, outForDeliveryNotifier);
  return new UpdateDispatchController(useCase);
}
