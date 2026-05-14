import { GetCurrentBusinessSettingsUseCase } from "../application/use-cases/GetCurrentBusinessSettingsUseCase.js";
import { PrismaBusinessSettingsRepository } from "../infrastructure/prisma/PrismaBusinessSettingsRepository.js";
import { GetCurrentBusinessSettingsController } from "../presentation/controllers/GetCurrentBusinessSettingsController.js";

export function makeGetCurrentBusinessSettingsController() {
  const repository = new PrismaBusinessSettingsRepository();
  const useCase = new GetCurrentBusinessSettingsUseCase(repository);
  return new GetCurrentBusinessSettingsController(useCase);
}
