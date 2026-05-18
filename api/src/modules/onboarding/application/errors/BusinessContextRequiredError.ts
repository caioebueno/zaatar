export class BusinessContextRequiredError extends Error {
  constructor() {
    super("BUSINESS_CONTEXT_REQUIRED");
    this.name = "BusinessContextRequiredError";
  }
}
