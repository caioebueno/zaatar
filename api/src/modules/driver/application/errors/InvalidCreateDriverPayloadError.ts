export class InvalidCreateDriverPayloadError extends Error {
  constructor(public readonly field: string) {
    super("INVALID_CREATE_DRIVER_PAYLOAD");
    this.name = "InvalidCreateDriverPayloadError";
  }
}
