export class InvalidChatwootChatsQueryError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid chatwoot chats query field: ${field}`);
    this.name = "InvalidChatwootChatsQueryError";
  }
}

