import { LoginOwnerUseCase } from "../application/use-cases/LoginOwnerUseCase.js";
import { PrismaOwnerRepository } from "../infrastructure/prisma/PrismaOwnerRepository.js";
import { HmacAccessTokenSigner } from "../infrastructure/security/HmacAccessTokenSigner.js";
import { ScryptPasswordHasher } from "../infrastructure/security/ScryptPasswordHasher.js";
import { LoginOwnerController } from "../presentation/controllers/LoginOwnerController.js";

export function makeLoginOwnerController() {
  const ownerRepository = new PrismaOwnerRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const accessTokenSigner = new HmacAccessTokenSigner();

  const loginOwnerUseCase = new LoginOwnerUseCase(
    ownerRepository,
    passwordHasher,
    accessTokenSigner,
  );

  return new LoginOwnerController(loginOwnerUseCase);
}
