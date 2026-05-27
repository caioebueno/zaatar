export class InvalidChatwootWebhookPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid chatwoot webhook payload field: ${field}`);
  }
}
