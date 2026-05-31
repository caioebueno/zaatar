import { ListChatwootConversationMessagesUseCase } from "../application/use-cases/ListChatwootConversationMessagesUseCase.js";
import { ListChatwootChatsUseCase } from "../application/use-cases/ListChatwootChatsUseCase.js";
import { SendChatwootConversationMessageUseCase } from "../application/use-cases/SendChatwootConversationMessageUseCase.js";
import { TakeCareChatwootConversationUseCase } from "../application/use-cases/TakeCareChatwootConversationUseCase.js";
import { ResolveChatwootConversationUseCase } from "../application/use-cases/ResolveChatwootConversationUseCase.js";
import { MarkChatwootConversationReadUseCase } from "../application/use-cases/MarkChatwootConversationReadUseCase.js";
import { HttpChatwootProxyGateway } from "../infrastructure/http/HttpChatwootProxyGateway.js";
import { PrismaChatConversationOrderRepository } from "../infrastructure/prisma/PrismaChatConversationOrderRepository.js";
import { PrismaBranchChatwootConfigRepository } from "../infrastructure/prisma/PrismaBranchChatwootConfigRepository.js";
import { ChatwootProxyController } from "../presentation/controllers/ChatwootProxyController.js";

export function makeChatwootProxyController() {
  const gateway = new HttpChatwootProxyGateway();
  const branchRepository = new PrismaBranchChatwootConfigRepository();
  const orderRepository = new PrismaChatConversationOrderRepository();
  const listChatsUseCase = new ListChatwootChatsUseCase(
    gateway,
    branchRepository,
    orderRepository,
  );
  const listConversationMessagesUseCase =
    new ListChatwootConversationMessagesUseCase(gateway, branchRepository);
  const sendConversationMessageUseCase =
    new SendChatwootConversationMessageUseCase(gateway, branchRepository);
  const takeCareConversationUseCase = new TakeCareChatwootConversationUseCase(
    gateway,
    branchRepository,
  );
  const resolveConversationUseCase = new ResolveChatwootConversationUseCase(
    gateway,
    branchRepository,
  );
  const markConversationReadUseCase = new MarkChatwootConversationReadUseCase(
    gateway,
    branchRepository,
  );

  return new ChatwootProxyController(
    listChatsUseCase,
    listConversationMessagesUseCase,
    sendConversationMessageUseCase,
    takeCareConversationUseCase,
    resolveConversationUseCase,
    markConversationReadUseCase,
  );
}
