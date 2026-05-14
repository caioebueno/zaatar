import { UpdateCurrentBusinessSettingsUseCase } from "../application/use-cases/UpdateCurrentBusinessSettingsUseCase.js";
import { PrismaBusinessSettingsRepository } from "../infrastructure/prisma/PrismaBusinessSettingsRepository.js";
import { UpdateCurrentBusinessSettingsController } from "../presentation/controllers/UpdateCurrentBusinessSettingsController.js";

export function makeUpdateCurrentBusinessSettingsController() {
  const repository = new PrismaBusinessSettingsRepository();
  const useCase = new UpdateCurrentBusinessSettingsUseCase(repository);
  return new UpdateCurrentBusinessSettingsController(useCase);
}
