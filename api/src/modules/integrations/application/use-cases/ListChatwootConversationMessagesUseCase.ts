import { BranchChatwootConfigMissingError } from "../errors/BranchChatwootConfigMissingError.js";
import { BranchNotFoundForConversationError } from "../errors/BranchNotFoundForConversationError.js";
import { InvalidChatwootChatsQueryError } from "../errors/InvalidChatwootChatsQueryError.js";
import type { BranchChatwootConfigRepository } from "../ports/BranchChatwootConfigRepository.js";
import type { ChatwootProxyGateway } from "../ports/ChatwootProxyGateway.js";

export type ListChatwootConversationMessagesInput = {
  businessId?: string;
  conversationId: string;
  query: Record<string, string | undefined>;
};

export class ListChatwootConversationMessagesUseCase {
  constructor(
    private readonly gateway: ChatwootProxyGateway,
    private readonly branchRepository: BranchChatwootConfigRepository,
  ) {}

  async execute(input: ListChatwootConversationMessagesInput): Promise<unknown> {
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

    const query = sanitizeQuery(input.query);
    delete query.branchId;

    return this.gateway.listConversationMessages({
      accountId: branch.chatwootAccountId,
      conversationId,
      query,
    });
  }
}

function sanitizeQuery(
  value: Record<string, string | undefined>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined) continue;
    const normalized = raw.trim();
    if (!normalized) continue;
    sanitized[key] = normalized;
  }

  assertPositiveIntegerIfPresent(sanitized.page, "page");
  assertPositiveIntegerIfPresent(sanitized.per_page, "per_page");

  return sanitized;
}

function assertPositiveIntegerIfPresent(
  value: string | undefined,
  field: string,
): void {
  if (value === undefined) return;
  if (!/^\d+$/.test(value)) {
    throw new InvalidChatwootChatsQueryError(field);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidChatwootChatsQueryError(field);
  }
}

