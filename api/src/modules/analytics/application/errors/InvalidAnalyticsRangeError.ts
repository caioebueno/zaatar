export class InvalidAnalyticsRangeError extends Error {
  constructor(
    public readonly field:
      | "from"
      | "to"
      | "dateRange"
      | "businessId"
      | "startDate"
      | "endDate"
      | "compareStartDate"
      | "timezone",
    message: string,
  ) {
    super(message);
    this.name = "InvalidAnalyticsRangeError";
  }
}
