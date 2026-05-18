export class InvalidDispatchStartedDeliveryPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid dispatch started-delivery payload field: ${field}`);
    this.name = "InvalidDispatchStartedDeliveryPayloadError";
  }
}

