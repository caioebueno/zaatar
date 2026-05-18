export class OrderNotFoundError extends Error {
  constructor() {
    super("ORDER_NOT_FOUND");
    this.name = "OrderNotFoundError";
  }
}
