import { PrismaOwnerRepository } from "../../owner/infrastructure/prisma/PrismaOwnerRepository.js";
import { ScryptPasswordHasher } from "../../owner/infrastructure/security/ScryptPasswordHasher.js";
import { AddCurrentBusinessMemberUseCase } from "../application/use-cases/AddCurrentBusinessMemberUseCase.js";
import { ListCurrentBusinessMembersUseCase } from "../application/use-cases/ListCurrentBusinessMembersUseCase.js";
import { PrismaBusinessRepository } from "../infrastructure/prisma/PrismaBusinessRepository.js";
import { BusinessMembersController } from "../presentation/controllers/BusinessMembersController.js";

export function makeBusinessMembersController() {
  const businessRepository = new PrismaBusinessRepository();
  const ownerRepository = new PrismaOwnerRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const listUseCase = new ListCurrentBusinessMembersUseCase(businessRepository);
  const addUseCase = new AddCurrentBusinessMemberUseCase(
    businessRepository,
    ownerRepository,
    passwordHasher,
  );

  return new BusinessMembersController(listUseCase, addUseCase);
}
