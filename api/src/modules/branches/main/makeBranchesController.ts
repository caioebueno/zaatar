import { CreateBranchUseCase } from "../application/use-cases/CreateBranchUseCase.js";
import { PrismaBusinessOnboardingRepository } from "../../onboarding/infrastructure/prisma/PrismaBusinessOnboardingRepository.js";
import { BranchesController } from "../presentation/controllers/BranchesController.js";

export function makeBranchesController() {
  const repository = new PrismaBusinessOnboardingRepository();
  const createBranchUseCase = new CreateBranchUseCase(repository);
  return new BranchesController(createBranchUseCase);
}
