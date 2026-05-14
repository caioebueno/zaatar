export class InvalidAnalyticsRangeError extends Error {
  constructor(
    public readonly field: "from" | "to" | "dateRange",
    message: string,
  ) {
    super(message);
    this.name = "InvalidAnalyticsRangeError";
  }
}
