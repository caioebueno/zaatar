import { GetDriverByIdUseCase } from "../application/use-cases/GetDriverByIdUseCase.js";
import { UpdateDriverUseCase } from "../application/use-cases/UpdateDriverUseCase.js";
import { PrismaDriverRepository } from "../infrastructure/prisma/PrismaDriverRepository.js";
import { DriverSelfController } from "../presentation/controllers/DriverSelfController.js";

export function makeDriverSelfController() {
  const driverRepository = new PrismaDriverRepository();
  const getDriverByIdUseCase = new GetDriverByIdUseCase(driverRepository);
  const updateDriverUseCase = new UpdateDriverUseCase(driverRepository);

  return new DriverSelfController(getDriverByIdUseCase, updateDriverUseCase);
}
