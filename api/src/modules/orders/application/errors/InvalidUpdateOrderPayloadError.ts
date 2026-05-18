export class InvalidUpdateOrderPayloadError extends Error {
  constructor(public readonly field: string) {
    super("INVALID_UPDATE_ORDER_PAYLOAD");
    this.name = "InvalidUpdateOrderPayloadError";
  }
}
