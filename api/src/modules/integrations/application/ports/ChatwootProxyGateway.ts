export type ListChatwootChatsGatewayInput = {
  accountId: string;
  sourceId: string;
  query: Record<string, string>;
};

export type ListChatwootConversationMessagesGatewayInput = {
  accountId: string;
  conversationId: string;
  query: Record<string, string>;
};

export type AssignChatwootConversationGatewayInput = {
  accountId: string;
  assigneeId: number;
  conversationId: string;
};

export type CreateChatwootConversationMessageGatewayInput = {
  accountId: string;
  content: string;
  contentAttributes?: Record<string, unknown>;
  conversationId: string;
  private?: boolean;
};

export type ResolveChatwootConversationGatewayInput = {
  accountId: string;
  conversationId: string;
};

export type MarkChatwootConversationReadGatewayInput = {
  accountId: string;
  conversationId: string;
};

export type ChatwootProxyGateway = {
  listChats(input: ListChatwootChatsGatewayInput): Promise<unknown>;
  listConversationMessages(
    input: ListChatwootConversationMessagesGatewayInput,
  ): Promise<unknown>;
  assignConversationToAgent(
    input: AssignChatwootConversationGatewayInput,
  ): Promise<unknown>;
  createConversationMessage(
    input: CreateChatwootConversationMessageGatewayInput,
  ): Promise<unknown>;
  resolveConversation(
    input: ResolveChatwootConversationGatewayInput,
  ): Promise<unknown>;
  markConversationRead(
    input: MarkChatwootConversationReadGatewayInput,
  ): Promise<unknown>;
};
