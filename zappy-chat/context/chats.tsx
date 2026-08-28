import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './auth';
import { useRealtime } from './realtime';
import { fetchConversations, type ConversationSummary, type ConversationOrder, type ConversationOrderIntent } from '../lib/api';

export type ChatState = 'ai_handling' | 'take_care';

export type Chat = {
  id: string;
  name: string;
  phone: string | null;
  source: 'whatsapp';
  last: string;
  when: string;
  unread: number;
  state: ChatState;
  handler: { kind: 'bot'; note: string } | { kind: 'agent'; who: string; note: string };
  order: ConversationOrder | null;
  orderIntent: ConversationOrderIntent | null;
};

export function relativeTime(ts: number | string | null | undefined): string {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? ts * 1000 : Date.parse(String(ts));
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function mapConversation(conv: ConversationSummary): Chat {
  const sender = conv.meta?.sender as any;
  const assignee = conv.meta?.assignee as any;
  const name: string = sender?.name ?? 'Unknown';
  const phone: string | null = sender?.phone_number ?? sender?.identifier ?? null;

  const rawState = conv.status;
  const state: ChatState = rawState === 'take_care' ? 'take_care' : 'ai_handling';

  const handler: Chat['handler'] = assignee?.name
    ? { kind: 'agent', who: assignee.name, note: 'In conversation' }
    : { kind: 'bot', note: 'AI is handling' };

  const lastMsgObj: any =
    (conv.last_non_activity_message as any) ??
    (Array.isArray(conv.messages) && conv.messages.length
      ? conv.messages[conv.messages.length - 1]
      : null);
  const lastMsgHasImage = ((lastMsgObj?.attachments as any[]) ?? [])
    .some((a: any) => a.file_type === 'image');
  const lastMsg: string =
    lastMsgObj?.content?.trim() ||
    (lastMsgHasImage ? 'Image' : '');

  return {
    id: String(conv.id),
    name,
    phone,
    source: 'whatsapp',
    last: lastMsg,
    when: relativeTime(conv.last_activity_at),
    unread: conv.unread_count ?? 0,
    state,
    handler,
    order: ((conv as any).order as ConversationOrder | null | undefined) ?? null,
    orderIntent: ((conv as any).orderIntent as ConversationOrderIntent | null | undefined) ?? null,
  };
}

type ChatsContextValue = {
  chats: Chat[];
  loadingChats: boolean;
  fetchError: string | null;
  refreshing: boolean;
  load: (silent?: boolean) => Promise<void>;
  setChatsAndRef: (updater: (prev: Chat[]) => Chat[]) => void;
  setRefreshing: (v: boolean) => void;
};

const ChatsContext = createContext<ChatsContextValue | null>(null);

export function ChatsProvider({ children }: { children: ReactNode }) {
  const { token, businessId, branchId: storedBranchId, logout } = useAuth();
  const branchId = storedBranchId ?? 'f27dacf2-e11d-4cde-9d02-a50431a19fef';
  const { subscribe } = useRealtime();

  const [chats, setChats] = useState<Chat[]>([]);
  const chatsRef = useRef<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const setChatsAndRef = useCallback((updater: (prev: Chat[]) => Chat[]) => {
    setChats(prev => {
      const next = updater(prev);
      chatsRef.current = next;
      return next;
    });
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!token || !branchId) return;
    if (!silent) setLoadingChats(true);
    setFetchError(null);
    try {
      const res = await fetchConversations(token, businessId, branchId, { per_page: 50 });
      const payload = res?.data?.payload ?? [];
      const mapped = payload.map(mapConversation);
      chatsRef.current = mapped;
      setChats(mapped);
    } catch (e: any) {
      if (e?.status === 401) {
        await logout();
      } else {
        setFetchError('Could not load conversations. Pull down to retry.');
      }
    } finally {
      setLoadingChats(false);
      setRefreshing(false);
    }
  }, [token, businessId, branchId, logout]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    return subscribe((event) => {
      const cid = event.conversationId != null ? String(event.conversationId) : null;


      if (event.type === 'message_created') {
        const d = event.data;
        const content = d.content.trim();
        const lastPreview = content || (d.hasImage ? 'Image' : '') || (d.hasAudio ? 'Voice message' : '') || '';
        const isCustomer = d.isCustomerMessage || d.direction === 'incoming';
        const state: ChatState = d.inboxStatus === 'take_care' ? 'take_care' : 'ai_handling';
        const isKnown = cid != null && chatsRef.current.some(c => c.id === cid);

        if (isKnown) {
          setChatsAndRef(prev => {
            const next = prev.map(c => {
              if (c.id !== cid) return c;
              return { ...c, last: lastPreview || c.last, when: relativeTime(d.messageSentAt ?? null) || c.when, unread: isCustomer ? c.unread + 1 : c.unread, state };
            });
            const idx = next.findIndex(c => c.id === cid);
            if (idx > 0) {
              const [chat] = next.splice(idx, 1);
              return [chat, ...next];
            }
            return next;
          });
        } else if (cid) {
          const newChat: Chat = {
            id: cid,
            name: d.senderName ?? 'Unknown',
            phone: null,
            source: 'whatsapp',
            last: lastPreview,
            when: relativeTime(d.messageSentAt ?? null),
            unread: isCustomer ? 1 : 0,
            state,
            handler: { kind: 'bot', note: 'AI is handling' },
            order: null,
            orderIntent: null,
          };
          setChatsAndRef(p => p.some(c => c.id === cid) ? p : [newChat, ...p]);
        }
      } else if (event.type === 'chat_status_changed') {
        const d = event.data;
        const state: ChatState = d.inboxStatus === 'take_care' ? 'take_care' : 'ai_handling';
        if (cid) setChatsAndRef(prev => prev.map(c => c.id === cid ? { ...c, state } : c));
      }
      // conversation_read: no list update needed
    });
  }, [subscribe, setChatsAndRef]);

  return (
    <ChatsContext.Provider value={{ chats, loadingChats, fetchError, refreshing, load, setChatsAndRef, setRefreshing }}>
      {children}
    </ChatsContext.Provider>
  );
}

export function useChats() {
  const ctx = useContext(ChatsContext);
  if (!ctx) throw new Error('useChats must be used within ChatsProvider');
  return ctx;
}
