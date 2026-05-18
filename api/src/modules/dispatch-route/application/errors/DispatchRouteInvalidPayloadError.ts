export class DispatchRouteInvalidPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid dispatch route payload field: ${field}`);
    this.name = "DispatchRouteInvalidPayloadError";
  }
}

