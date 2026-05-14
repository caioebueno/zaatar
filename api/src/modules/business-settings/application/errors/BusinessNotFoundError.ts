export class BusinessNotFoundError extends Error {
  constructor() {
    super("Business not found");
    this.name = "BusinessNotFoundError";
  }
}
