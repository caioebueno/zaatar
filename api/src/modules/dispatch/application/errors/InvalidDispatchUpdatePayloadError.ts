export class InvalidDispatchUpdatePayloadError extends Error {
  constructor(public readonly field: string) {
    super("INVALID_DISPATCH_UPDATE_PAYLOAD");
    this.name = "InvalidDispatchUpdatePayloadError";
  }
}
