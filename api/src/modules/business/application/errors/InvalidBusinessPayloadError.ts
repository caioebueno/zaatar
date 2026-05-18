export class InvalidBusinessPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid business payload: ${field}`);
    this.name = "InvalidBusinessPayloadError";
  }
}
