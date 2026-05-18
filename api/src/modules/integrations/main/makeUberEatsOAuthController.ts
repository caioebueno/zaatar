import { PublishUberEatsMenuUseCase } from "../application/use-cases/PublishUberEatsMenuUseCase.js";
import { GetUberEatsConnectionUseCase } from "../application/use-cases/GetUberEatsConnectionUseCase.js";
import { SaveUberEatsConnectionUseCase } from "../application/use-cases/SaveUberEatsConnectionUseCase.js";
import { PrismaUberEatsConnectionRepository } from "../infrastructure/prisma/PrismaUberEatsConnectionRepository.js";
import { PrismaUberEatsMenuSyncRepository } from "../infrastructure/prisma/PrismaUberEatsMenuSyncRepository.js";
import { UberEatsOAuthController } from "../presentation/controllers/UberEatsOAuthController.js";

export function makeUberEatsOAuthController() {
  const connectionRepository = new PrismaUberEatsConnectionRepository();
  const syncRepository = new PrismaUberEatsMenuSyncRepository();
  const getConnectionUseCase = new GetUberEatsConnectionUseCase(connectionRepository);
  const saveConnectionUseCase = new SaveUberEatsConnectionUseCase(connectionRepository);
  const publishMenuUseCase = new PublishUberEatsMenuUseCase(
    connectionRepository,
    syncRepository,
  );

  return new UberEatsOAuthController(
    getConnectionUseCase,
    saveConnectionUseCase,
    publishMenuUseCase,
    syncRepository,
  );
}
