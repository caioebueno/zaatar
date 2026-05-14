export class InvalidPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid payload: ${field}`);
    this.name = "InvalidPayloadError";
  }
}
