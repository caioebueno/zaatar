const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

// ─── Event types ───────────────────────────────────────────────

type BaseEvent<TType extends string, TData> = {
  id: string;
  type: TType;
  businessId: string;
  branchId: string;
  conversationId: string | null;
  createdAt: string;
  data: TData;
};

export type MessageCreatedData = {
  conversationId: string | null;
  content: string;
  direction: 'incoming' | 'outgoing' | 'unknown';
  source: 'customer' | 'agent' | 'ai' | 'unknown';
  isCustomerMessage: boolean;
  messageSentAt: string | null;
  senderName?: string | null;
  assignedToAgent?: boolean;
  assigneeId?: string | null;
  status?: string | null;
  inboxStatus: 'take_care' | 'ai_is_handling';
  hasAudio?: boolean;
  audioAttachments?: Array<{ id: string | null; url: string | null; fileType: string | null; durationSeconds: number | null }>;
  hasImage?: boolean;
  imageAttachments?: Array<{ id: string | null; url: string | null; thumbnailUrl: string | null; fileType: string | null; width: number | null; height: number | null }>;
};

export type ChatStatusChangedData = {
  conversationId: string | null;
  content?: string;
  direction?: 'incoming' | 'outgoing' | 'unknown';
  source?: 'customer' | 'agent' | 'ai' | 'unknown';
  isCustomerMessage?: boolean;
  messageSentAt?: string | null;
  senderName?: string | null;
  assignedToAgent?: boolean;
  assigneeId?: string | number | null;
  status?: string | null;
  inboxStatus: 'take_care' | 'ai_is_handling';
  hasAudio?: boolean;
  audioAttachments?: Array<{ id: string | null; url: string | null; fileType: string | null; durationSeconds: number | null }>;
  hasImage?: boolean;
  imageAttachments?: Array<{ id: string | null; url: string | null; thumbnailUrl: string | null; fileType: string | null; width: number | null; height: number | null }>;
};

export type ConversationReadData = {
  conversationId: string;
  unreadCount: number;
};

export type ChatwootRealtimeEvent =
  | BaseEvent<'message_created', MessageCreatedData>
  | BaseEvent<'chat_status_changed', ChatStatusChangedData>
  | BaseEvent<'conversation_read', ConversationReadData>;

export type EventHandler = (event: ChatwootRealtimeEvent) => void;

// ─── SSE client ────────────────────────────────────────────────

export class SSEClient {
  private url: string;
  private headers: Record<string, string>;
  private xhr: XMLHttpRequest | null = null;
  private handlers = new Set<EventHandler>();
  private lastEventId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private offset = 0;
  private buffer = '';

  constructor(branchId: string, headers: Record<string, string>) {
    const qs = new URLSearchParams({ branchId });
    this.url = `${BASE}/conversation/stream?${qs}`;
    this.headers = headers;
  }

  addHandler(h: EventHandler) { this.handlers.add(h); }
  removeHandler(h: EventHandler) { this.handlers.delete(h); }

  connect() {
    if (this.destroyed) return;
    this.buffer = '';
    this.offset = 0;

    const xhr = new XMLHttpRequest();
    this.xhr = xhr;

    const connectUrl = this.lastEventId
      ? `${this.url}&afterEventId=${encodeURIComponent(this.lastEventId)}`
      : this.url;

    xhr.open('GET', connectUrl, true);
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    Object.entries(this.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.onreadystatechange = () => {
      if (xhr.readyState >= 3 && xhr.responseText.length > this.offset) {
        const chunk = xhr.responseText.slice(this.offset);
        this.offset = xhr.responseText.length;
        this.processChunk(chunk);
      }
      if (xhr.readyState === 4 && !this.destroyed) {
        this.scheduleReconnect();
      }
    };

    xhr.onerror = () => {
      if (!this.destroyed) this.scheduleReconnect();
    };

    xhr.send();
  }

  private processChunk(chunk: string) {
    this.buffer += chunk;
    const blocks = this.buffer.split('\n\n');
    this.buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      let eventId = '';
      let sseEventType = '';
      let data = '';

      for (const line of block.split('\n')) {
        if (line.startsWith('id:')) eventId = line.slice(3).trim();
        else if (line.startsWith('event:')) sseEventType = line.slice(6).trim();
        else if (line.startsWith('data:')) data = line.slice(5).trim();
      }

      if (!data) continue;
      if (eventId) this.lastEventId = eventId;

      try {
        const parsed = JSON.parse(data) as any;
        if (!parsed.type) parsed.type = parsed.event ?? sseEventType ?? undefined;
        this.handlers.forEach(h => h(parsed as ChatwootRealtimeEvent));
      } catch {}
    }
  }

  private scheduleReconnect(delayMs = 3000) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) this.connect();
    }, delayMs);
  }

  destroy() {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.xhr) {
      this.xhr.abort();
      this.xhr = null;
    }
  }
}
