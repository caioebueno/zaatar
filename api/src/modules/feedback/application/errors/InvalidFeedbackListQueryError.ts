export class InvalidFeedbackListQueryError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "InvalidFeedbackListQueryError";
  }
}
