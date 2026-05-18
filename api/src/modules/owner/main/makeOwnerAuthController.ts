import { SendOwnerOtpUseCase } from "../application/use-cases/SendOwnerOtpUseCase.js";
import { VerifyOwnerOtpUseCase } from "../application/use-cases/VerifyOwnerOtpUseCase.js";
import { TwilioOwnerOtpSender } from "../infrastructure/messaging/TwilioOwnerOtpSender.js";
import { PrismaOwnerRepository } from "../infrastructure/prisma/PrismaOwnerRepository.js";
import { HmacAccessTokenSigner } from "../infrastructure/security/HmacAccessTokenSigner.js";
import { OwnerAuthController } from "../presentation/controllers/OwnerAuthController.js";

export function makeOwnerAuthController() {
  const ownerRepository = new PrismaOwnerRepository();
  const ownerOtpSender = new TwilioOwnerOtpSender();
  const accessTokenSigner = new HmacAccessTokenSigner();

  const sendOwnerOtpUseCase = new SendOwnerOtpUseCase(
    ownerRepository,
    ownerOtpSender,
  );
  const verifyOwnerOtpUseCase = new VerifyOwnerOtpUseCase(
    ownerRepository,
    accessTokenSigner,
  );

  return new OwnerAuthController(sendOwnerOtpUseCase, verifyOwnerOtpUseCase);
}
