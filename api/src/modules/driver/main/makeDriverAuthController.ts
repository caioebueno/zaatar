import { SendDriverOtpUseCase } from "../application/use-cases/SendDriverOtpUseCase.js";
import { VerifyDriverOtpUseCase } from "../application/use-cases/VerifyDriverOtpUseCase.js";
import { TwilioDriverOtpSender } from "../infrastructure/messaging/TwilioDriverOtpSender.js";
import { PrismaDriverAuthRepository } from "../infrastructure/prisma/PrismaDriverAuthRepository.js";
import { HmacDriverAccessTokenSigner } from "../infrastructure/security/HmacDriverAccessTokenSigner.js";
import { DriverAuthController } from "../presentation/controllers/DriverAuthController.js";

export function makeDriverAuthController() {
  const driverAuthRepository = new PrismaDriverAuthRepository();
  const driverOtpSender = new TwilioDriverOtpSender();
  const accessTokenSigner = new HmacDriverAccessTokenSigner();

  const sendDriverOtpUseCase = new SendDriverOtpUseCase(
    driverAuthRepository,
    driverOtpSender,
  );

  const verifyDriverOtpUseCase = new VerifyDriverOtpUseCase(
    driverAuthRepository,
    accessTokenSigner,
  );

  return new DriverAuthController(sendDriverOtpUseCase, verifyDriverOtpUseCase);
}
