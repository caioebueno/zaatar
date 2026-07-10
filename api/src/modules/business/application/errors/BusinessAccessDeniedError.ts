export class BusinessAccessDeniedError extends Error {
  constructor() {
    super("BUSINESS_ACCESS_DENIED");
    this.name = "BusinessAccessDeniedError";
  }
}
