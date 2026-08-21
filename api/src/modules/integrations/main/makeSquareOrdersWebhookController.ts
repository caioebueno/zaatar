import { HandleSquareOrdersWebhookUseCase } from "../application/use-cases/HandleSquareOrdersWebhookUseCase.js";
import { SquareConnectionAccessTokenResolver } from "../infrastructure/http/SquareConnectionAccessTokenResolver.js";
import { HttpSquareOrdersGateway } from "../infrastructure/http/HttpSquareOrdersGateway.js";
import { PrismaSquareConnectionRepository } from "../infrastructure/prisma/PrismaSquareConnectionRepository.js";
import { SquareOrdersWebhookController } from "../presentation/controllers/SquareOrdersWebhookController.js";

export function makeSquareOrdersWebhookController() {
  const squareConnectionRepository = new PrismaSquareConnectionRepository();
  const squareTokenResolver = new SquareConnectionAccessTokenResolver(
    squareConnectionRepository,
  );

  return new SquareOrdersWebhookController(
    new HandleSquareOrdersWebhookUseCase(new HttpSquareOrdersGateway()),
    squareTokenResolver,
  );
}
