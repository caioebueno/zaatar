export class InvalidDispatchNextPayloadError extends Error {
  constructor(public readonly field: string) {
    super("INVALID_DISPATCH_NEXT_PAYLOAD");
    this.name = "InvalidDispatchNextPayloadError";
  }
}
