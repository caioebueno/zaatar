import { createHmac, timingSafeEqual } from "node:crypto";
import { InvalidChatwootWebhookPayloadError } from "../errors/InvalidChatwootWebhookPayloadError.js";
import type { ChatwootWebhookRepository } from "../ports/ChatwootWebhookRepository.js";
import type { PushNotificationSender } from "../ports/PushNotificationSender.js";
import { chatwootRealtimeHub } from "../../../../shared/realtime/chatwootRealtimeHub.js";
const CHATWOOT_WEBHOOK_DEBUG_ENABLED = process.env.DEV === "1";

type HandleChatwootWebhookUseCaseInput = {
  rawBody: Buffer;
  signature?: string | null;
  token?: string | null;
};

type HandleChatwootWebhookUseCaseOutput = {
  event: string;
  matched: boolean;
  notificationsSent: number;
  skippedReason?: string;
};

type ParsedWebhookPayload = {
  accountId: string | null;
  assignedToAgent: boolean;
  assigneeChanged: boolean;
  assigneeId: string | null;
  audioAttachments: Array<{
    durationSeconds: number | null;
    fileType: string | null;
    id: string | null;
    url: string | null;
  }>;
  imageAttachments: Array<{
    fileType: string | null;
    height: number | null;
    id: string | null;
    thumbnailUrl: string | null;
    url: string | null;
    width: number | null;
  }>;
  content: string;
  conversationId: string | null;
  direction: "incoming" | "outgoing" | "unknown";
  event: string;
  incomingMessage: boolean;
  isCustomerMessage: boolean;
  messageSentAt: string | null;
  source: "customer" | "agent" | "ai" | "unknown";
  statusChanged: boolean;
  status: string | null;
  senderName: string | null;
  sourceId: string | null;
};

export class HandleChatwootWebhookUseCase {
  constructor(
    private readonly repository: ChatwootWebhookRepository,
    private readonly pushNotificationSender: PushNotificationSender,
  ) {}

  async execute(
    input: HandleChatwootWebhookUseCaseInput,
  ): Promise<HandleChatwootWebhookUseCaseOutput> {
    verifyWebhookSignature(input.rawBody, input.signature, input.token);

    const payload = parseWebhookPayload(input.rawBody);
    logInboxStatusChangedWebhookBody(input.rawBody, payload);

    const normalizedStatus = payload.status?.trim().toLowerCase() ?? null;
    if (normalizedStatus === "resolved") {
      return {
        event: payload.event,
        matched: true,
        notificationsSent: 0,
        skippedReason: "RESOLVED_STATUS_IGNORED",
      };
    }

    if (!payload.accountId && !payload.sourceId) {
      return {
        event: payload.event,
        matched: false,
        notificationsSent: 0,
        skippedReason: "ACCOUNT_AND_SOURCE_ID_MISSING",
      };
    }
    const businessMatch = await this.repository.findBusinessByChatwootAccount({
      accountId: payload.accountId,
      sourceId: payload.sourceId,
    });

    if (!businessMatch) {
      return {
        event: payload.event,
        matched: false,
        notificationsSent: 0,
        skippedReason: "BRANCH_NOT_MAPPED",
      };
    }

    const isMessageCreatedEvent = payload.event === "message_created";
    const isChatStatusEvent =
      payload.event === "conversation_status_changed" ||
      payload.event === "conversation_updated";
    const shouldEmitChatStatusEvent =
      isChatStatusEvent && (payload.statusChanged || payload.assigneeChanged);

    if (!isMessageCreatedEvent && !isChatStatusEvent) {
      return {
        event: payload.event,
        matched: true,
        notificationsSent: 0,
        skippedReason: "EVENT_NOT_EMITTED",
      };
    }

    if (isChatStatusEvent && !shouldEmitChatStatusEvent) {
      return {
        event: payload.event,
        matched: true,
        notificationsSent: 0,
        skippedReason: "STATUS_OR_ASSIGNEE_NOT_CHANGED",
      };
    }

    chatwootRealtimeHub.publish({
      businessId: businessMatch.businessId,
      branchId: businessMatch.branchId,
      conversationId: payload.conversationId,
      type: shouldEmitChatStatusEvent ? "chat_status_changed" : "message_created",
      data: {
        event: payload.event,
        conversationId: payload.conversationId,
        content: getRealtimeContent(payload),
        direction: payload.direction,
        source: payload.source,
        isCustomerMessage: payload.isCustomerMessage,
        messageSentAt: payload.messageSentAt,
        assignedToAgent: payload.assignedToAgent,
        assigneeChanged: payload.assigneeChanged,
        assigneeId: payload.assigneeId,
        hasAudio: payload.audioAttachments.length > 0,
        audioAttachments: payload.audioAttachments,
        hasImage: payload.imageAttachments.length > 0,
        imageAttachments: payload.imageAttachments,
        status: payload.status,
        statusChanged: payload.statusChanged,
        senderName: payload.senderName,
      },
    });

    const shouldNotifyTakeCare =
      payload.assignedToAgent && payload.event !== "message_created";
    const shouldNotify = payload.incomingMessage || shouldNotifyTakeCare;

    if (!shouldNotify) {
      return {
        event: payload.event,
        matched: true,
        notificationsSent: 0,
        skippedReason: "NON_INCOMING_MESSAGE",
      };
    }

    const tokens = await this.repository.listOwnerIosPushTokensByBusinessId(
      businessMatch.businessId,
    );

    if (tokens.length === 0) {
      return {
        event: payload.event,
        matched: true,
        notificationsSent: 0,
        skippedReason: "NO_REGISTERED_IOS_DEVICES",
      };
    }

    const title = shouldNotifyTakeCare
      ? "Conversation needs take care"
      : payload.senderName
        ? `New message from ${payload.senderName}`
        : "New customer message";
    const body = shouldNotifyTakeCare
      ? payload.senderName
        ? `${payload.senderName} conversation was assigned to an agent.`
        : "A conversation was assigned to an agent."
      : getNotificationBody(payload);

    await this.pushNotificationSender.send({
      tokens,
      title,
      body,
      data: {
        branchId: businessMatch.branchId,
        conversationId: payload.conversationId,
        event: payload.event,
        assignedToAgent: payload.assignedToAgent,
        assigneeId: payload.assigneeId,
        notificationType: shouldNotifyTakeCare
          ? "conversation_assigned"
          : "incoming_message",
      },
    });

    return {
      event: payload.event,
      matched: true,
      notificationsSent: tokens.length,
    };
  }
}

function logInboxStatusChangedWebhookBody(
  rawBody: Buffer,
  payload: ParsedWebhookPayload,
): void {
  if (!CHATWOOT_WEBHOOK_DEBUG_ENABLED) return;
  if (
    payload.event !== "conversation_status_changed" &&
    payload.event !== "conversation_updated"
  ) {
    return;
  }

  const bodyText = rawBody.toString("utf8");
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    console.log("[chatwoot-webhook] inbox-status-changed webhook body", parsed);
  } catch {
    console.log("[chatwoot-webhook] inbox-status-changed webhook body", bodyText);
  }
}

function parseWebhookPayload(rawBody: Buffer): ParsedWebhookPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new InvalidChatwootWebhookPayloadError("body");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new InvalidChatwootWebhookPayloadError("body");
  }

  const body = parsed as Record<string, unknown>;
  const account = asRecord(body.account);
  const inbox = asRecord(body.inbox);
  const conversation = asRecord(body.conversation);
  const message = asRecord(body.message);
  const sender = asRecord(body.sender);
  const contentAttributes = asRecord(body.content_attributes);
  const meta = asRecord(body.meta);
  const conversationMeta = asRecord(conversation?.meta);
  const conversationSender = asRecord(conversationMeta?.sender);
  const conversationAccount = asRecord(conversation?.account);
  const messageConversation = asRecord(message?.conversation);
  const messageAccount = asRecord(message?.account);
  const metaAccount = asRecord(meta?.account);
  const messageSender = asRecord(message?.sender);
  const messageContentAttributes = asRecord(message?.content_attributes);
  const event = parseRequiredString(body.event, "event");
  const statusChanged = hasConversationFieldChanged({
    event,
    body,
    fieldCandidates: [
      "status",
      "conversation.status",
    ],
    explicitPreviousValueCandidates: [
      body.previous_status,
      body.previousStatus,
      conversation?.previous_status,
      conversation?.previousStatus,
    ],
  });
  const assigneeChanged = hasConversationFieldChanged({
    event,
    body,
    fieldCandidates: [
      "assignee_id",
      "assignee",
      "conversation.assignee_id",
      "conversation.meta.assignee.id",
    ],
    explicitPreviousValueCandidates: [
      body.previous_assignee_id,
      body.previousAssigneeId,
      conversation?.previous_assignee_id,
      conversation?.previousAssigneeId,
    ],
  });
  const accountId = parseOptionalNumericLikeString(
    account?.id ??
      conversationAccount?.id ??
      messageAccount?.id ??
      body.account_id ??
      conversation?.account_id ??
      message?.account_id ??
      inbox?.account_id ??
      meta?.account_id ??
      metaAccount?.id,
  );
  const sourceId = parseOptionalNumericLikeString(
    inbox?.id ??
      body.inbox_id ??
      conversation?.inbox_id ??
      asRecord(conversation?.inbox)?.id,
  );
  const conversationId = parseOptionalNumericLikeString(
    conversation?.id ??
      messageConversation?.id ??
      body.conversation_id ??
      meta?.conversation_id ??
      body.id,
  );

  const conversationMessages = Array.isArray(conversation?.messages)
    ? conversation.messages
    : [];
  const latestConversationMessage =
    conversationMessages.length > 0
      ? asRecord(conversationMessages[conversationMessages.length - 1])
      : null;
  const attachments = pickAttachments([
    body.attachments,
    message?.attachments,
    latestConversationMessage?.attachments,
  ]);
  const audioAttachments = extractAudioAttachments(attachments);
  const imageAttachments = extractImageAttachments(attachments);

  const contentText =
    parseOptionalString(body.content) ??
    parseOptionalString(message?.content) ??
    parseOptionalString(latestConversationMessage?.content) ??
    "";
  const content = contentText.trim();
  const messageSentAt = parseTimestampToIsoString(
    body.created_at ??
      message?.created_at ??
      latestConversationMessage?.created_at ??
      body.timestamp,
  );

  const senderName =
    parseOptionalString(sender?.name) ??
    parseOptionalString(messageSender?.name) ??
    parseOptionalString(conversationSender?.name) ??
    null;

  const status =
    parseOptionalString(body.status) ??
    parseOptionalString(conversation?.status) ??
    null;
  const assigneeId = parseOptionalNumericLikeString(
    body.assignee_id ??
      conversation?.assignee_id ??
      message?.assignee_id ??
      meta?.assignee_id ??
      asRecord(meta?.assignee)?.id ??
      asRecord(conversationMeta?.assignee)?.id,
  );
  const assignedToAgent = Boolean(assigneeId);

  const messageType = normalizeMessageType(
    body.message_type ?? message?.message_type,
  );
  const senderType = normalizeOptionalString(
    parseOptionalString(sender?.type) ??
      parseOptionalString(messageSender?.type) ??
      parseOptionalString(conversationSender?.type),
  );
  const contentSentBy =
    parseOptionalString(contentAttributes?.sent_by) ??
    parseOptionalString(messageContentAttributes?.sent_by) ??
    null;
  const sentBy = normalizeOptionalString(contentSentBy);

  const source = resolveMessageSource({
    direction: messageType,
    senderType,
    sentBy,
  });
  const isCustomerMessage = source === "customer";

  const incomingMessage =
    event === "message_created" &&
    messageType === "incoming" &&
    sentBy !== "ai";

  return {
    event,
    accountId,
    assignedToAgent,
    assigneeChanged,
    assigneeId,
    audioAttachments,
    imageAttachments,
    sourceId,
    conversationId,
    content,
    direction: messageType,
    source,
    isCustomerMessage,
    messageSentAt,
    statusChanged,
    status,
    senderName,
    incomingMessage,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function normalizeMessageType(value: unknown): "incoming" | "outgoing" | "unknown" {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "incoming") return "incoming";
    if (normalized === "outgoing") return "outgoing";
  }

  if (typeof value === "number") {
    if (value === 0) return "incoming";
    if (value === 1) return "outgoing";
  }

  return "unknown";
}

function resolveMessageSource(input: {
  direction: "incoming" | "outgoing" | "unknown";
  senderType: string | null;
  sentBy: string | null;
}): "customer" | "agent" | "ai" | "unknown" {
  if (input.direction === "incoming") {
    return "customer";
  }

  if (input.sentBy === "ai") {
    return "ai";
  }

  if (input.senderType?.includes("bot")) {
    return "ai";
  }

  if (input.direction === "outgoing") {
    return "agent";
  }

  return "unknown";
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function hasConversationFieldChanged(input: {
  event: string;
  body: Record<string, unknown>;
  fieldCandidates: string[];
  explicitPreviousValueCandidates: unknown[];
}): boolean {
  const normalizedEvent = input.event.trim().toLowerCase();
  if (normalizedEvent === "conversation_status_changed") {
    if (
      input.fieldCandidates.some((candidate) =>
        candidate === "status" || candidate === "conversation.status",
      )
    ) {
      return true;
    }
  }

  if (input.explicitPreviousValueCandidates.some((value) => value !== undefined && value !== null)) {
    return true;
  }

  const changedAttributesCandidates: unknown[] = [
    input.body.changed_attributes,
    input.body.changedAttributes,
    asRecord(input.body.conversation)?.changed_attributes,
    asRecord(input.body.conversation)?.changedAttributes,
    asRecord(input.body.meta)?.changed_attributes,
    asRecord(input.body.meta)?.changedAttributes,
    input.body.previous_changes,
    input.body.previousChanges,
    asRecord(input.body.conversation)?.previous_changes,
    asRecord(input.body.conversation)?.previousChanges,
    asRecord(input.body.meta)?.previous_changes,
    asRecord(input.body.meta)?.previousChanges,
  ];

  const keys = new Set<string>();
  for (const candidate of input.fieldCandidates) {
    const normalized = normalizeChangedAttributeKey(candidate);
    if (normalized) {
      keys.add(normalized);
    }
  }

  for (const candidate of changedAttributesCandidates) {
    if (changedAttributesContainsAnyKey(candidate, keys)) {
      return true;
    }
  }

  return false;
}

function normalizeChangedAttributeKey(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.replace(/[^a-z0-9]/g, "");
}

function changedAttributesContainsAnyKey(
  value: unknown,
  keys: Set<string>,
): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (typeof item === "string") {
        return keys.has(normalizeChangedAttributeKey(item));
      }
      if (item && typeof item === "object" && !Array.isArray(item)) {
        return changedAttributesContainsAnyKey(item, keys);
      }
      return false;
    });
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  for (const [rawKey, nestedValue] of Object.entries(record)) {
    if (keys.has(normalizeChangedAttributeKey(rawKey))) {
      return true;
    }

    if (changedAttributesContainsAnyKey(nestedValue, keys)) {
      return true;
    }
  }

  return false;
}

function normalizeOptionalString(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function pickAttachments(values: unknown[]): Array<Record<string, unknown>> {
  for (const value of values) {
    if (!Array.isArray(value)) {
      continue;
    }

    const items = value
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item));
    if (items.length > 0) {
      return items;
    }
  }

  return [];
}

function extractAudioAttachments(
  attachments: Array<Record<string, unknown>>,
): Array<{
  durationSeconds: number | null;
  fileType: string | null;
  id: string | null;
  url: string | null;
}> {
  const audio: Array<{
    durationSeconds: number | null;
    fileType: string | null;
    id: string | null;
    url: string | null;
  }> = [];

  for (const item of attachments) {
    const fileType = parseOptionalString(item.file_type) ?? parseOptionalString(item.type);
    const contentType =
      parseOptionalString(item.content_type) ??
      parseOptionalString(item.mime_type) ??
      parseOptionalString(item.mimeType);
    const normalizedType = normalizeOptionalString(fileType);
    const normalizedContentType = normalizeOptionalString(contentType);
    const isAudio =
      normalizedType === "audio" ||
      normalizedContentType?.startsWith("audio/") === true;

    if (!isAudio) {
      continue;
    }

    const id = parseOptionalNumericLikeString(item.id);
    const url =
      parseOptionalString(item.data_url) ??
      parseOptionalString(item.url) ??
      parseOptionalString(item.file_url) ??
      parseOptionalString(item.thumb_url);
    const durationSeconds = parseOptionalNumber(
      item.duration ??
        item.duration_seconds ??
        item.audio_duration_seconds ??
        item.length_seconds,
    );

    audio.push({
      id,
      url,
      fileType: fileType ?? contentType ?? null,
      durationSeconds,
    });
  }

  return audio;
}

function extractImageAttachments(
  attachments: Array<Record<string, unknown>>,
): Array<{
  fileType: string | null;
  height: number | null;
  id: string | null;
  thumbnailUrl: string | null;
  url: string | null;
  width: number | null;
}> {
  const images: Array<{
    fileType: string | null;
    height: number | null;
    id: string | null;
    thumbnailUrl: string | null;
    url: string | null;
    width: number | null;
  }> = [];

  for (const item of attachments) {
    const fileType = parseOptionalString(item.file_type) ?? parseOptionalString(item.type);
    const contentType =
      parseOptionalString(item.content_type) ??
      parseOptionalString(item.mime_type) ??
      parseOptionalString(item.mimeType);
    const normalizedType = normalizeOptionalString(fileType);
    const normalizedContentType = normalizeOptionalString(contentType);
    const isImage =
      normalizedType === "image" ||
      normalizedContentType?.startsWith("image/") === true;

    if (!isImage) {
      continue;
    }

    const id = parseOptionalNumericLikeString(item.id);
    const url =
      parseOptionalString(item.data_url) ??
      parseOptionalString(item.url) ??
      parseOptionalString(item.file_url);
    const thumbnailUrl =
      parseOptionalString(item.thumb_url) ??
      parseOptionalString(item.preview_url) ??
      null;
    const width = parseOptionalNumber(item.width ?? item.meta_width);
    const height = parseOptionalNumber(item.height ?? item.meta_height);

    images.push({
      id,
      url,
      thumbnailUrl,
      fileType: fileType ?? contentType ?? null,
      width,
      height,
    });
  }

  return images;
}

function parseTimestampToIsoString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (/^\d+$/.test(trimmed)) {
      const numeric = Number.parseInt(trimmed, 10);
      if (Number.isFinite(numeric)) {
        const milliseconds =
          numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
        const date = new Date(milliseconds);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      }
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function getRealtimeContent(payload: ParsedWebhookPayload): string {
  return payload.content;
}

function getNotificationBody(payload: ParsedWebhookPayload): string {
  return payload.content;
}

function parseRequiredString(value: unknown, field: string): string {
  const normalized = parseOptionalString(value);
  if (!normalized) {
    throw new InvalidChatwootWebhookPayloadError(field);
  }

  return normalized;
}

function parseNumericLikeString(value: unknown, field: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized) return normalized;
  }

  throw new InvalidChatwootWebhookPayloadError(field);
}

function parseOptionalNumericLikeString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || null;
  }

  return null;
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string | null | undefined,
  token: string | null | undefined,
): void {
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET?.trim();
  if (!secret) return;

  const normalizedToken = token?.trim() || null;
  if (normalizedToken) {
    const tokenBuffer = Buffer.from(normalizedToken);
    const secretBuffer = Buffer.from(secret);
    if (
      tokenBuffer.length === secretBuffer.length &&
      timingSafeEqual(tokenBuffer, secretBuffer)
    ) {
      return;
    }
  }

  const received = normalizeSignature(signature);
  if (!received) {
    throw new InvalidChatwootWebhookPayloadError("x-chatwoot-signature");
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new InvalidChatwootWebhookPayloadError("x-chatwoot-signature");
  }
}

function normalizeSignature(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.startsWith("sha256=")) {
    return normalized.slice("sha256=".length).trim() || null;
  }

  return normalized;
}
