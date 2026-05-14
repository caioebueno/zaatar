import { GetCurrentBusinessSettingsUseCase } from "../application/use-cases/GetCurrentBusinessSettingsUseCase.js";
import { PrismaBusinessSettingsRepository } from "../infrastructure/prisma/PrismaBusinessSettingsRepository.js";
import { GetPublicBusinessSettingsController } from "../presentation/controllers/GetPublicBusinessSettingsController.js";

export function makeGetPublicBusinessSettingsController() {
  const repository = new PrismaBusinessSettingsRepository();
  const useCase = new GetCurrentBusinessSettingsUseCase(repository);
  return new GetPublicBusinessSettingsController(useCase);
}

