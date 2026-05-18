import { DispatchRouteController } from "../presentation/controllers/DispatchRouteController.js";
import { AddDispatchRoutePointsBatchUseCase } from "../application/use-cases/AddDispatchRoutePointsBatchUseCase.js";
import { GetDispatchRouteUseCase } from "../application/use-cases/GetDispatchRouteUseCase.js";
import { IngestDriverLocationUseCase } from "../application/use-cases/IngestDriverLocationUseCase.js";
import { StartDispatchRouteSessionUseCase } from "../application/use-cases/StartDispatchRouteSessionUseCase.js";
import { StopDispatchRouteSessionUseCase } from "../application/use-cases/StopDispatchRouteSessionUseCase.js";
import { PrismaDispatchRouteRepository } from "../infrastructure/prisma/PrismaDispatchRouteRepository.js";

export function makeDispatchRouteController(): DispatchRouteController {
  const repository = new PrismaDispatchRouteRepository();

  const startUseCase = new StartDispatchRouteSessionUseCase(repository);
  const addPointsBatchUseCase = new AddDispatchRoutePointsBatchUseCase(repository);
  const ingestDriverLocationUseCase = new IngestDriverLocationUseCase(repository);
  const stopUseCase = new StopDispatchRouteSessionUseCase(repository);
  const getDispatchRouteUseCase = new GetDispatchRouteUseCase(repository);

  return new DispatchRouteController(
    startUseCase,
    addPointsBatchUseCase,
    ingestDriverLocationUseCase,
    stopUseCase,
    getDispatchRouteUseCase,
  );
}
