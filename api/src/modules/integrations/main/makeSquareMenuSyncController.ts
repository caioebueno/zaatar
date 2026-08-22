import { HttpSquareCatalogGateway } from "../infrastructure/http/HttpSquareCatalogGateway.js";
import { SquareConnectionAccessTokenResolver } from "../infrastructure/http/SquareConnectionAccessTokenResolver.js";
import { PrismaSquareConnectionRepository } from "../infrastructure/prisma/PrismaSquareConnectionRepository.js";
import { SquareMenuSyncController } from "../presentation/controllers/SquareMenuSyncController.js";
import { PublishSquareMenusUseCase } from "../application/use-cases/PublishSquareMenusUseCase.js";

export function makeSquareMenuSyncController() {
  const squareCatalogGateway = new HttpSquareCatalogGateway();
  const publishSquareMenusUseCase = new PublishSquareMenusUseCase(squareCatalogGateway);
  const squareConnectionRepository = new PrismaSquareConnectionRepository();
  const squareTokenResolver = new SquareConnectionAccessTokenResolver(
    squareConnectionRepository,
  );

  return new SquareMenuSyncController(
    publishSquareMenusUseCase,
    squareTokenResolver,
  );
}
