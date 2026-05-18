export class InvalidUpdateDriverPayloadError extends Error {
  constructor(public readonly field: string) {
    super("INVALID_UPDATE_DRIVER_PAYLOAD");
    this.name = "InvalidUpdateDriverPayloadError";
  }
}
