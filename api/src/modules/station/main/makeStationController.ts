import { PrismaStationRepository } from "../infrastructure/prisma/PrismaStationRepository.js";
import { StationController } from "../presentation/controllers/StationController.js";

export function makeStationController(): StationController {
  const repository = new PrismaStationRepository();
  return new StationController(repository);
}
