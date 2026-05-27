import { BranchChatwootConfigMissingError } from "../errors/BranchChatwootConfigMissingError.js";
import { BranchNotFoundForConversationError } from "../errors/BranchNotFoundForConversationError.js";
import { InvalidChatwootChatsQueryError } from "../errors/InvalidChatwootChatsQueryError.js";
import type { BranchChatwootConfigRepository } from "../ports/BranchChatwootConfigRepository.js";
import type { ChatwootProxyGateway } from "../ports/ChatwootProxyGateway.js";

export type ListChatwootChatsInput = {
  businessId?: string;
  query: Record<string, string | undefined>;
};

export class ListChatwootChatsUseCase {
  constructor(
    private readonly gateway: ChatwootProxyGateway,
    private readonly branchRepository: BranchChatwootConfigRepository,
  ) {}

  async execute(input: ListChatwootChatsInput): Promise<unknown> {
    const businessId = (input.businessId ?? "").trim();
    if (!businessId) {
      throw new InvalidChatwootChatsQueryError("businessId");
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
    if (!branch.chatwootSourceId) {
      throw new BranchChatwootConfigMissingError("chatwootSourceId");
    }

    const query = sanitizeQuery(input.query);
    delete query.branchId;
    query.status = "all";

    const response = await this.gateway.listChats({
      accountId: branch.chatwootAccountId,
      sourceId: branch.chatwootSourceId,
      query,
    });

    return applyConversationStatusAbstraction(response);
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

function applyConversationStatusAbstraction(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const root = value as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return value;
  }

  const dataRecord = data as Record<string, unknown>;
  const payload = dataRecord.payload;
  if (!Array.isArray(payload)) {
    return value;
  }

  const normalizedPayload = payload
    .filter((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return true;
      }

      const row = item as Record<string, unknown>;
      const rawStatus =
        typeof row.chatwootStatus === "string"
          ? row.chatwootStatus
          : typeof row.status === "string"
            ? row.status
            : null;

      return rawStatus?.trim().toLowerCase() !== "resolved";
    })
    .map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }

    const row = item as Record<string, unknown>;
    const assigneeId = row.assignee_id;
    const metaAssigneeId = readMetaAssigneeId(row.meta);
    const hasAssignee =
      hasValueAssigneeId(assigneeId) || hasValueAssigneeId(metaAssigneeId);
    const nextStatus = hasAssignee ? "take_care" : "ai_is_handling";

    const originalStatus = row.status;
    return {
      ...row,
      chatwootStatus:
        typeof row.chatwootStatus === "string"
          ? row.chatwootStatus
          : originalStatus,
      status: nextStatus,
    };
  });

  return {
    ...root,
    data: {
      ...dataRecord,
      payload: normalizedPayload,
    },
  };
}

function readMetaAssigneeId(meta: unknown): number | string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return null;
  }
  const metaRecord = meta as Record<string, unknown>;
  const assignee = metaRecord.assignee;
  if (!assignee || typeof assignee !== "object" || Array.isArray(assignee)) {
    return null;
  }
  const assigneeRecord = assignee as Record<string, unknown>;
  const id = assigneeRecord.id;
  if (typeof id === "number" || typeof id === "string") {
    return id;
  }
  return null;
}

function hasValueAssigneeId(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return false;
}
