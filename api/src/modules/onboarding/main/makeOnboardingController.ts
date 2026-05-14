import { CreateStripeOnboardingLinkUseCase } from "../application/use-cases/CreateStripeOnboardingLinkUseCase.js";
import { CreateOnboardingBranchUseCase } from "../application/use-cases/CreateOnboardingBranchUseCase.js";
import { DeleteOnboardingBranchUseCase } from "../application/use-cases/DeleteOnboardingBranchUseCase.js";
import { GetBusinessOnboardingStatusUseCase } from "../application/use-cases/GetBusinessOnboardingStatusUseCase.js";
import { RefreshStripeOnboardingStatusUseCase } from "../application/use-cases/RefreshStripeOnboardingStatusUseCase.js";
import { UpdateBusinessOnboardingBasicInfoUseCase } from "../application/use-cases/UpdateBusinessOnboardingBasicInfoUseCase.js";
import { UpdateOnboardingBranchUseCase } from "../application/use-cases/UpdateOnboardingBranchUseCase.js";
import { UpdateStripeBankingProfileUseCase } from "../application/use-cases/UpdateStripeBankingProfileUseCase.js";
import { StripeNotConfiguredError } from "../application/errors/StripeNotConfiguredError.js";
import type { StripeConnectGateway } from "../application/ports/StripeConnectGateway.js";
import { PrismaBusinessOnboardingRepository } from "../infrastructure/prisma/PrismaBusinessOnboardingRepository.js";
import { StripeConnectHttpGateway } from "../infrastructure/stripe/StripeConnectHttpGateway.js";
import { OnboardingController } from "../presentation/controllers/OnboardingController.js";

export function makeOnboardingController() {
  const repository = new PrismaBusinessOnboardingRepository();
  const stripeGateway = createStripeGateway();

  const getOnboardingStatusUseCase = new GetBusinessOnboardingStatusUseCase(repository);
  const updateBusinessBasicInfoUseCase = new UpdateBusinessOnboardingBasicInfoUseCase(
    repository,
  );
  const createStripeOnboardingLinkUseCase = new CreateStripeOnboardingLinkUseCase(
    repository,
    stripeGateway,
  );
  const createOnboardingBranchUseCase = new CreateOnboardingBranchUseCase(repository);
  const updateOnboardingBranchUseCase = new UpdateOnboardingBranchUseCase(repository);
  const deleteOnboardingBranchUseCase = new DeleteOnboardingBranchUseCase(repository);
  const refreshStripeOnboardingStatusUseCase = new RefreshStripeOnboardingStatusUseCase(
    repository,
    stripeGateway,
  );
  const updateStripeBankingProfileUseCase = new UpdateStripeBankingProfileUseCase(
    repository,
    stripeGateway,
  );

  return new OnboardingController(
    getOnboardingStatusUseCase,
    updateBusinessBasicInfoUseCase,
    createOnboardingBranchUseCase,
    updateOnboardingBranchUseCase,
    deleteOnboardingBranchUseCase,
    createStripeOnboardingLinkUseCase,
    refreshStripeOnboardingStatusUseCase,
    updateStripeBankingProfileUseCase,
  );
}

function createStripeGateway(): StripeConnectGateway {
  try {
    return new StripeConnectHttpGateway();
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return {
        async createExpressConnectedAccount() {
          throw new StripeNotConfiguredError();
        },
        async createOnboardingLink() {
          throw new StripeNotConfiguredError();
        },
        async updateConnectedAccountBanking() {
          throw new StripeNotConfiguredError();
        },
        async fetchConnectedAccountStatus() {
          throw new StripeNotConfiguredError();
        },
      };
    }
    throw error;
  }
}
