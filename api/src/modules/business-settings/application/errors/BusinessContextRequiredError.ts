export class BusinessContextRequiredError extends Error {
  constructor() {
    super("Business context is required");
    this.name = "BusinessContextRequiredError";
  }
}
