export class InvalidDispatchListPayloadError extends Error {
  constructor(public readonly field: string) {
    super("INVALID_DISPATCH_LIST_PAYLOAD");
    this.name = "InvalidDispatchListPayloadError";
  }
}
