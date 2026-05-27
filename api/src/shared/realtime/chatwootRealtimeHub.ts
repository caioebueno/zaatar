import type { ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

export type ChatwootRealtimeEventType =
  | "message_created"
  | "chat_status_changed"
  | "conversation_read";

export type ChatwootRealtimeEvent = {
  branchId: string;
  businessId: string;
  conversationId: string | null;
  createdAt: string;
  data: Record<string, unknown>;
  id: string;
  type: ChatwootRealtimeEventType;
};

type Subscriber = {
  branchId: string;
  businessId: string;
  conversationId: string | null;
  response: ServerResponse;
};

type DeliveryStats = {
  chat: number;
  inbox: number;
  total: number;
};

const MAX_BUFFERED_EVENTS = 1000;
const HEARTBEAT_MS = 20_000;

export class ChatwootRealtimeHub {
  private readonly bufferedEvents: ChatwootRealtimeEvent[] = [];
  private readonly subscribers = new Map<string, Subscriber>();

  publish(event: Omit<ChatwootRealtimeEvent, "createdAt" | "id">): ChatwootRealtimeEvent {
    const normalizedData = withInboxStatus(event.type, event.data);
    const normalized: ChatwootRealtimeEvent = {
      ...event,
      data: normalizedData,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.deliver(normalized);

    return normalized;
  }

  private deliver(event: ChatwootRealtimeEvent): DeliveryStats {
    this.bufferedEvents.push(event);
    if (this.bufferedEvents.length > MAX_BUFFERED_EVENTS) {
      this.bufferedEvents.splice(0, this.bufferedEvents.length - MAX_BUFFERED_EVENTS);
    }

    let deliveredTotal = 0;
    let deliveredToInbox = 0;
    let deliveredToChat = 0;
    for (const [subscriberId, subscriber] of this.subscribers.entries()) {
      if (!eventMatchesSubscriber(event, subscriber)) {
        continue;
      }

      try {
        writeSseEvent(subscriber.response, "chatwoot_event", event, event.id);
        deliveredTotal += 1;
        if (subscriber.conversationId) {
          deliveredToChat += 1;
        } else {
          deliveredToInbox += 1;
        }
      } catch {
        this.subscribers.delete(subscriberId);
      }
    }

    return {
      total: deliveredTotal,
      inbox: deliveredToInbox,
      chat: deliveredToChat,
    };
  }

  getBufferedEvents(input: {
    afterEventId?: string | null;
    branchId: string;
    businessId: string;
    conversationId?: string | null;
    limit?: number;
  }): ChatwootRealtimeEvent[] {
    const afterEventId = input.afterEventId?.trim() || null;
    const limit = Number.isFinite(input.limit)
      ? Math.max(1, Math.min(200, input.limit ?? 100))
      : 100;

    let startIndex = 0;
    if (afterEventId) {
      const index = this.bufferedEvents.findIndex((item) => item.id === afterEventId);
      startIndex = index >= 0 ? index + 1 : 0;
    }

    const conversationId = input.conversationId?.trim() || null;
    const matches = this.bufferedEvents.filter((item, idx) => {
      if (idx < startIndex) return false;
      if (item.businessId !== input.businessId) return false;
      if (item.branchId !== input.branchId) return false;
      if (conversationId && item.conversationId !== conversationId) return false;
      return true;
    });

    return matches.slice(Math.max(0, matches.length - limit));
  }

  subscribe(input: {
    branchId: string;
    businessId: string;
    conversationId?: string | null;
    response: ServerResponse;
  }): () => void {
    const id = randomUUID();
    const subscriber: Subscriber = {
      businessId: input.businessId,
      branchId: input.branchId,
      conversationId: input.conversationId?.trim() || null,
      response: input.response,
    };
    this.subscribers.set(id, subscriber);

    const heartbeat = setInterval(() => {
      try {
        input.response.write(`: keep-alive ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeat);
        this.subscribers.delete(id);
      }
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(heartbeat);
      this.subscribers.delete(id);
    };
  }
}

export const chatwootRealtimeHub = new ChatwootRealtimeHub();

type InboxStatus = "ai_is_handling" | "take_care";

function withInboxStatus(
  type: ChatwootRealtimeEventType,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (type === "conversation_read") {
    return data;
  }

  const inboxStatus = resolveInboxStatus(type, data);
  return {
    ...data,
    inboxStatus,
  };
}

function resolveInboxStatus(
  _type: ChatwootRealtimeEventType,
  data: Record<string, unknown>,
): InboxStatus {
  const normalizedStatus = normalizeStatusValue(data.status);
  if (normalizedStatus) {
    return normalizedStatus;
  }

  if (isAssignedToAgent(data)) {
    return "take_care";
  }

  return "ai_is_handling";
}

function normalizeStatusValue(value: unknown): InboxStatus | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "take_care") return "take_care";
  if (
    normalized === "ai_handled" ||
    normalized === "ai_handling" ||
    normalized === "ai_is_handling"
  ) {
    return "ai_is_handling";
  }

  return null;
}

function isAssignedToAgent(data: Record<string, unknown>): boolean {
  const assignedToAgent = data.assignedToAgent;
  if (assignedToAgent === true) {
    return true;
  }

  const assigneeId = data.assigneeId;
  if (typeof assigneeId === "number") {
    return Number.isFinite(assigneeId);
  }
  if (typeof assigneeId === "string") {
    return assigneeId.trim().length > 0;
  }

  return false;
}

function writeSseEvent(
  response: ServerResponse,
  eventName: string,
  payload: unknown,
  eventId?: string,
): void {
  if (eventId) {
    response.write(`id: ${eventId}\n`);
  }
  response.write(`event: ${eventName}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function eventMatchesSubscriber(
  event: ChatwootRealtimeEvent,
  subscriber: Subscriber,
): boolean {
  if (event.businessId !== subscriber.businessId) return false;
  if (event.branchId !== subscriber.branchId) return false;
  if (subscriber.conversationId && subscriber.conversationId !== event.conversationId) {
    return false;
  }
  return true;
}
