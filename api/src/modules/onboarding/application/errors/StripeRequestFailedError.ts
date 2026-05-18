export class StripeRequestFailedError extends Error {
  constructor(
    public readonly statusCode: number,
    message = "STRIPE_REQUEST_FAILED",
  ) {
    super(message);
    this.name = "StripeRequestFailedError";
  }
}
