import { PublishSquareMenusUseCase } from "../application/use-cases/PublishSquareMenusUseCase.js";
import { HttpSquareCatalogGateway } from "../infrastructure/http/HttpSquareCatalogGateway.js";
import { HttpSquareOrdersGateway } from "../infrastructure/http/HttpSquareOrdersGateway.js";
import { PrismaSquareConnectionRepository } from "../infrastructure/prisma/PrismaSquareConnectionRepository.js";
import { SquareOAuthController } from "../presentation/controllers/SquareOAuthController.js";

export function makeSquareOAuthController() {
  const squareCatalogGateway = new HttpSquareCatalogGateway();
  const publishSquareMenusUseCase = new PublishSquareMenusUseCase(squareCatalogGateway);

  return new SquareOAuthController(
    new PrismaSquareConnectionRepository(),
    new HttpSquareOrdersGateway(),
    publishSquareMenusUseCase,
  );
}
