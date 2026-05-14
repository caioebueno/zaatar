import { RegisterOwnerUseCase } from "../application/use-cases/RegisterOwnerUseCase.js";
import { RandomIdGenerator } from "../infrastructure/id/RandomIdGenerator.js";
import { PrismaOwnerRepository } from "../infrastructure/prisma/PrismaOwnerRepository.js";
import { ScryptPasswordHasher } from "../infrastructure/security/ScryptPasswordHasher.js";
import { RegisterOwnerController } from "../presentation/controllers/RegisterOwnerController.js";

export function makeRegisterOwnerController() {
  const ownerRepository = new PrismaOwnerRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const idGenerator = new RandomIdGenerator();

  const registerOwnerUseCase = new RegisterOwnerUseCase(
    ownerRepository,
    passwordHasher,
    idGenerator,
  );

  return new RegisterOwnerController(registerOwnerUseCase);
}
