export class DriverNotFoundError extends Error {
  constructor() {
    super("DRIVER_NOT_FOUND");
    this.name = "DriverNotFoundError";
  }
}
