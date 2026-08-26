import { InventoryController } from "../presentation/controllers/InventoryController.js";
import { prismaInventoryRepository } from "../infrastructure/prisma/prismaInventoryRepository.js";

export function makeInventoryController() {
  return new InventoryController(prismaInventoryRepository);
}
