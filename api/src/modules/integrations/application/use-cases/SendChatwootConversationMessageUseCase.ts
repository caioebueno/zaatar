import { BranchChatwootConfigMissingError } from "../errors/BranchChatwootConfigMissingError.js";
import { BranchNotFoundForConversationError } from "../errors/BranchNotFoundForConversationError.js";
import { InvalidChatwootChatsQueryError } from "../errors/InvalidChatwootChatsQueryError.js";
import type { BranchChatwootConfigRepository } from "../ports/BranchChatwootConfigRepository.js";
import type { ChatwootProxyGateway } from "../ports/ChatwootProxyGateway.js";
import { chatwootRealtimeHub } from "../../../../shared/realtime/chatwootRealtimeHub.js";

export type SendChatwootConversationMessageInput = {
  body: unknown;
  businessId?: string;
  conversationId: string;
  query: Record<string, string | undefined>;
};

export class SendChatwootConversationMessageUseCase {
  constructor(
    private readonly gateway: ChatwootProxyGateway,
    private readonly branchRepository: BranchChatwootConfigRepository,
  ) {}

  async execute(input: SendChatwootConversationMessageInput): Promise<unknown> {
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

    const payload = parsePayload(input.body);
    const response = await this.gateway.createConversationMessage({
      accountId: branch.chatwootAccountId,
      content: payload.content,
      contentAttributes: payload.contentAttributes,
      conversationId,
      private: payload.private,
    });

    chatwootRealtimeHub.publish({
      businessId,
      branchId,
      conversationId,
      type: "message_created",
      data: {
        event: "message_created",
        conversationId,
        content: payload.content,
        direction: "outgoing",
        source: "agent",
        isCustomerMessage: false,
        messageSentAt: new Date().toISOString(),
      },
    });

    return response;
  }
}

type ParsedPayload = {
  content: string;
  contentAttributes?: Record<string, unknown>;
  private?: boolean;
};

function parsePayload(value: unknown): ParsedPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidChatwootChatsQueryError("content");
  }
  const record = value as Record<string, unknown>;

  if (typeof record.content !== "string" || !record.content.trim()) {
    throw new InvalidChatwootChatsQueryError("content");
  }
  const content = record.content.trim();

  const privateValue = record.private;
  if (privateValue !== undefined && typeof privateValue !== "boolean") {
    throw new InvalidChatwootChatsQueryError("private");
  }

  const contentAttributesValue = record.content_attributes;
  if (
    contentAttributesValue !== undefined &&
    (typeof contentAttributesValue !== "object" ||
      contentAttributesValue === null ||
      Array.isArray(contentAttributesValue))
  ) {
    throw new InvalidChatwootChatsQueryError("content_attributes");
  }

  return {
    content,
    private: privateValue as boolean | undefined,
    contentAttributes: contentAttributesValue as
      | Record<string, unknown>
      | undefined,
  };
}
