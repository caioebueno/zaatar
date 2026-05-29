export class OrderIntentCustomerNotFoundError extends Error {
  constructor() {
    super("Customer not found");
    this.name = "OrderIntentCustomerNotFoundError";
  }
}

