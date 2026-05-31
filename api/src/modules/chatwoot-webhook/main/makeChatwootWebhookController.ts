import { HandleChatwootWebhookUseCase } from "../application/use-cases/HandleChatwootWebhookUseCase.js";
import { RegisterOwnerIosPushTokenUseCase } from "../application/use-cases/RegisterOwnerIosPushTokenUseCase.js";
import { ExpoPushNotificationSender } from "../infrastructure/push/ExpoPushNotificationSender.js";
import { PrismaChatwootWebhookRepository } from "../infrastructure/prisma/PrismaChatwootWebhookRepository.js";
import { ChatwootWebhookController } from "../presentation/controllers/ChatwootWebhookController.js";

export function makeChatwootWebhookController() {
  const repository = new PrismaChatwootWebhookRepository();
  const sender = new ExpoPushNotificationSender();

  const handleWebhookUseCase = new HandleChatwootWebhookUseCase(
    repository,
    sender,
  );
  const registerOwnerIosPushTokenUseCase = new RegisterOwnerIosPushTokenUseCase(
    repository,
  );

  return new ChatwootWebhookController(
    handleWebhookUseCase,
    registerOwnerIosPushTokenUseCase,
  );
}
