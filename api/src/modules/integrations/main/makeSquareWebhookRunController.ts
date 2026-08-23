import { PrismaSquareWebhookRunRepository } from "../infrastructure/prisma/PrismaSquareWebhookRunRepository.js";
import { SquareWebhookRunController } from "../presentation/controllers/SquareWebhookRunController.js";

export function makeSquareWebhookRunController() {
  return new SquareWebhookRunController(new PrismaSquareWebhookRunRepository());
}
