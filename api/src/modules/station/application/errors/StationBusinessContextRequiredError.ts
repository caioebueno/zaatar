export class StationBusinessContextRequiredError extends Error {
  constructor() {
    super("Business context is required");
    this.name = "StationBusinessContextRequiredError";
  }
}

