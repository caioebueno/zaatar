import { CreateBusinessUseCase } from "../application/use-cases/CreateBusinessUseCase.js";
import { PrismaBusinessRepository } from "../infrastructure/prisma/PrismaBusinessRepository.js";
import { CreateBusinessController } from "../presentation/controllers/CreateBusinessController.js";
import { StripeNotConfiguredError } from "../../onboarding/application/errors/StripeNotConfiguredError.js";
import type { StripeConnectGateway } from "../../onboarding/application/ports/StripeConnectGateway.js";
import { StripeConnectHttpGateway } from "../../onboarding/infrastructure/stripe/StripeConnectHttpGateway.js";

export function makeCreateBusinessController() {
  const repository = new PrismaBusinessRepository();
  const stripeGateway = createStripeGateway();
  const useCase = new CreateBusinessUseCase(repository, stripeGateway);
  return new CreateBusinessController(useCase);
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
