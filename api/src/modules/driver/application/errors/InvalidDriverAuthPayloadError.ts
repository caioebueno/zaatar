export class InvalidDriverAuthPayloadError extends Error {
  constructor(public readonly field: string) {
    super("INVALID_DRIVER_AUTH_PAYLOAD");
    this.name = "InvalidDriverAuthPayloadError";
  }
}
