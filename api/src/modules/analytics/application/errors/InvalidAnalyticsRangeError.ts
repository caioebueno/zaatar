export class InvalidAnalyticsRangeError extends Error {
  constructor(
    public readonly field: "from" | "to" | "dateRange" | "businessId",
    message: string,
  ) {
    super(message);
    this.name = "InvalidAnalyticsRangeError";
  }
}
