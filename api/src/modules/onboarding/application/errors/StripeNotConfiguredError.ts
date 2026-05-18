export class StripeNotConfiguredError extends Error {
  constructor() {
    super("STRIPE_NOT_CONFIGURED");
    this.name = "StripeNotConfiguredError";
  }
}
