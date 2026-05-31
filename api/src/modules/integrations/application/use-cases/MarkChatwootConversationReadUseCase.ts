import { BranchChatwootConfigMissingError } from "../errors/BranchChatwootConfigMissingError.js";
import { BranchNotFoundForConversationError } from "../errors/BranchNotFoundForConversationError.js";
import { InvalidChatwootChatsQueryError } from "../errors/InvalidChatwootChatsQueryError.js";
import type { BranchChatwootConfigRepository } from "../ports/BranchChatwootConfigRepository.js";
import type { ChatwootProxyGateway } from "../ports/ChatwootProxyGateway.js";
import { chatwootRealtimeHub } from "../../../../shared/realtime/chatwootRealtimeHub.js";

export type MarkChatwootConversationReadInput = {
  businessId?: string;
  conversationId: string;
  query: Record<string, string | undefined>;
};

export class MarkChatwootConversationReadUseCase {
  constructor(
    private readonly gateway: ChatwootProxyGateway,
    private readonly branchRepository: BranchChatwootConfigRepository,
  ) {}

  async execute(input: MarkChatwootConversationReadInput): Promise<unknown> {
    const businessId = (input.businessId ?? "").trim();
    if (!businessId) {
      throw new InvalidChatwootChatsQueryError("businessId");
    }

    const conversationId = input.conversationId.trim();
    if (!conversationId) {
      throw new InvalidChatwootChatsQueryError("conversationId");
    }

    const branchId = (input.query.branchId ?? "").trim();
    if (!branchId) {
      throw new InvalidChatwootChatsQueryError("branchId");
    }

    const branch = await this.branchRepository.findByIdAndBusinessId(
      branchId,
      businessId,
    );
    if (!branch) {
      throw new BranchNotFoundForConversationError();
    }

    if (!branch.chatwootAccountId) {
      throw new BranchChatwootConfigMissingError("chatwootAccountId");
    }

    const response = await this.gateway.markConversationRead({
      accountId: branch.chatwootAccountId,
      conversationId,
    });

    chatwootRealtimeHub.publish({
      businessId,
      branchId,
      conversationId,
      type: "conversation_read",
      data: {
        conversationId,
        unreadCount: 0,
      },
    });

    return response;
  }
}
