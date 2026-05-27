export type ChatwootBusinessMatch = {
  branchId: string;
  businessId: string;
};

export type RegisterOwnerIosPushTokenInput = {
  businessId: string;
  pushToken: string;
  userId: string;
};

export type ChatwootWebhookRepository = {
  findBusinessByChatwootAccount: (input: {
    accountId?: string | null;
    sourceId?: string | null;
  }) => Promise<ChatwootBusinessMatch | null>;
  listOwnerIosPushTokensByBusinessId: (businessId: string) => Promise<string[]>;
  registerOwnerIosPushToken: (
    input: RegisterOwnerIosPushTokenInput,
  ) => Promise<void>;
};
