export class OrderIntentNotFoundError extends Error {
  constructor() {
    super("Order intent not found");
    this.name = "OrderIntentNotFoundError";
  }
}

