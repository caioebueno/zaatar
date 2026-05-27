import { BranchChatwootConfigMissingError } from "../errors/BranchChatwootConfigMissingError.js";
import { BranchNotFoundForConversationError } from "../errors/BranchNotFoundForConversationError.js";
import { InvalidChatwootChatsQueryError } from "../errors/InvalidChatwootChatsQueryError.js";
import type { BranchChatwootConfigRepository } from "../ports/BranchChatwootConfigRepository.js";
import type { ChatwootProxyGateway } from "../ports/ChatwootProxyGateway.js";
import { chatwootRealtimeHub } from "../../../../shared/realtime/chatwootRealtimeHub.js";

export type TakeCareChatwootConversationInput = {
  businessId?: string;
  conversationId: string;
  query: Record<string, string | undefined>;
};

export class TakeCareChatwootConversationUseCase {
  constructor(
    private readonly gateway: ChatwootProxyGateway,
    private readonly branchRepository: BranchChatwootConfigRepository,
  ) {}

  async execute(input: TakeCareChatwootConversationInput): Promise<unknown> {
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
    if (!branch.chatwootAgentId) {
      throw new BranchChatwootConfigMissingError("chatwootAgentId");
    }

    const assigneeId = Number.parseInt(branch.chatwootAgentId, 10);
    if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
      throw new InvalidChatwootChatsQueryError("chatwootAgentId");
    }

    const response = await this.gateway.assignConversationToAgent({
      accountId: branch.chatwootAccountId,
      assigneeId,
      conversationId,
    });

    chatwootRealtimeHub.publish({
      businessId,
      branchId,
      conversationId,
      type: "chat_status_changed",
      data: {
        conversationId,
        assigneeId,
        status: "take_care",
        assignedToAgent: true,
      },
    });

    return response;
  }
}
