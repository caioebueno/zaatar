export class ChatwootProxyRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseBody: unknown,
  ) {
    super(`Chatwoot request failed with status ${statusCode}`);
    this.name = "ChatwootProxyRequestError";
  }
}

