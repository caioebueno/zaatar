export class OrderIntentDeliveryAddressNotFoundError extends Error {
  constructor() {
    super("Delivery address not found for customer");
    this.name = "OrderIntentDeliveryAddressNotFoundError";
  }
}

