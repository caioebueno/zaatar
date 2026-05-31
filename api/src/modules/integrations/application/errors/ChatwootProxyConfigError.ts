export class ChatwootProxyConfigError extends Error {
  constructor(public readonly field: string) {
    super(`Chatwoot proxy is missing required config: ${field}`);
    this.name = "ChatwootProxyConfigError";
  }
}

