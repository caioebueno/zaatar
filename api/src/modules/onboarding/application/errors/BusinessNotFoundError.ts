export class BusinessNotFoundError extends Error {
  constructor() {
    super("BUSINESS_NOT_FOUND");
    this.name = "BusinessNotFoundError";
  }
}
