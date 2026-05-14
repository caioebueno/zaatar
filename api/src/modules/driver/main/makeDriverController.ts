import { CreateDriverUseCase } from "../application/use-cases/CreateDriverUseCase.js";
import { DeleteDriverUseCase } from "../application/use-cases/DeleteDriverUseCase.js";
import { GetDriverByIdUseCase } from "../application/use-cases/GetDriverByIdUseCase.js";
import { ListDriversUseCase } from "../application/use-cases/ListDriversUseCase.js";
import { UpdateDriverUseCase } from "../application/use-cases/UpdateDriverUseCase.js";
import { PrismaDriverRepository } from "../infrastructure/prisma/PrismaDriverRepository.js";
import { DriverController } from "../presentation/controllers/DriverController.js";

export function makeDriverController() {
  const driverRepository = new PrismaDriverRepository();
  const createDriverUseCase = new CreateDriverUseCase(driverRepository);
  const listDriversUseCase = new ListDriversUseCase(driverRepository);
  const getDriverByIdUseCase = new GetDriverByIdUseCase(driverRepository);
  const updateDriverUseCase = new UpdateDriverUseCase(driverRepository);
  const deleteDriverUseCase = new DeleteDriverUseCase(driverRepository);

  return new DriverController(
    createDriverUseCase,
    listDriversUseCase,
    getDriverByIdUseCase,
    updateDriverUseCase,
    deleteDriverUseCase,
  );
}
