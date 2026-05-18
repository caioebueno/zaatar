export class InvalidDriverIdError extends Error {
  constructor() {
    super("INVALID_DRIVER_ID");
    this.name = "InvalidDriverIdError";
  }
}
