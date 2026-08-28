export type ChatState = 'needs' | 'bot' | 'mine' | 'resolved';

export type Chat = {
  id: string;
  name: string;
  source: 'whatsapp';
  last: string;
  when: string;
  unread: number;
  state: ChatState;
  reason?: string;
  handler: { kind: 'bot'; note: string } | { kind: 'agent'; who: string; note: string };
  pinned?: boolean;
  muted?: boolean;
};

export const CHATS: Chat[] = [
  {
    id: 'c-04128',
    name: 'Lena Tanaka',
    source: 'whatsapp',
    last: "It's been 35 minutes and my driver hasn't moved. Can someone help?",
    when: 'now',
    unread: 3,
    state: 'needs',
    reason: 'Customer asked for a human · order #4128',
    handler: { kind: 'bot', note: 'Escalated 1m ago' },
    pinned: true,
  },
  {
    id: 'c-04131',
    name: 'Marco Bianchi',
    source: 'whatsapp',
    last: "I'd like to change the delivery address — apartment 4B not 4A",
    when: '2m',
    unread: 2,
    state: 'needs',
    reason: 'Address change after dispatch · #4131',
    handler: { kind: 'bot', note: "Bot can't edit dispatched orders" },
  },
  {
    id: 'c-04127',
    name: 'Priya Shah',
    source: 'whatsapp',
    last: 'Hi! Are you guys open until 10 tonight?',
    when: '4m',
    unread: 0,
    state: 'bot',
    handler: { kind: 'bot', note: 'Answering · hours' },
  },
  {
    id: 'c-04125',
    name: 'Diego Ramos',
    source: 'whatsapp',
    last: 'Great, thanks for confirming! See you at 8.',
    when: '8m',
    unread: 0,
    state: 'bot',
    handler: { kind: 'bot', note: 'Confirming reservation · 4 people' },
  },
  {
    id: 'c-04122',
    name: 'Sofia Andersen',
    source: 'whatsapp',
    last: "You: Sure — I'll waive the delivery fee on this one.",
    when: '12m',
    unread: 0,
    state: 'mine',
    handler: { kind: 'agent', who: 'You', note: 'In conversation' },
  },
  {
    id: 'c-04119',
    name: 'Hassan Idris',
    source: 'whatsapp',
    last: 'Yes that works — please send it to gate B',
    when: '21m',
    unread: 1,
    state: 'mine',
    handler: { kind: 'agent', who: 'You', note: 'In conversation' },
  },
  {
    id: 'c-04118',
    name: 'Yuki Watanabe',
    source: 'whatsapp',
    last: 'Bot: Your order #4118 is on its way. Sam will arrive in ~12 min.',
    when: '24m',
    unread: 0,
    state: 'bot',
    handler: { kind: 'bot', note: 'Tracking · delivery in 12m' },
  },
  {
    id: 'c-04115',
    name: 'Olivia Chen',
    source: 'whatsapp',
    last: "Bot: Menu sent. Let me know if you'd like to place an order.",
    when: '33m',
    unread: 0,
    state: 'bot',
    handler: { kind: 'bot', note: 'Sent menu · waiting' },
    muted: true,
  },
  {
    id: 'c-04108',
    name: 'Ben Müller',
    source: 'whatsapp',
    last: 'Bot: Glad to help — anything else?',
    when: '1h',
    unread: 0,
    state: 'resolved',
    handler: { kind: 'bot', note: 'Closed · refund issued' },
  },
  {
    id: 'c-04104',
    name: 'Aisha Khan',
    source: 'whatsapp',
    last: 'You: All sorted, the carbonara will be on the house next time.',
    when: '1h',
    unread: 0,
    state: 'resolved',
    handler: { kind: 'agent', who: 'You', note: 'Closed · complaint' },
  },
  {
    id: 'c-04101',
    name: 'Tomás Pereira',
    source: 'whatsapp',
    last: 'Bot: Order placed. You will receive a confirmation shortly.',
    when: '2h',
    unread: 0,
    state: 'resolved',
    handler: { kind: 'bot', note: 'Closed · order placed' },
  },
];

export const INBOX_TIME = '7:42 PM';

export type CountsMap = Record<'all' | 'needs' | 'bot' | 'mine' | 'resolved', number>;

export function getCounts(): CountsMap {
  return {
    all: CHATS.length,
    needs: CHATS.filter((c) => c.state === 'needs').length,
    bot: CHATS.filter((c) => c.state === 'bot').length,
    mine: CHATS.filter((c) => c.state === 'mine').length,
    resolved: CHATS.filter((c) => c.state === 'resolved').length,
  };
}
