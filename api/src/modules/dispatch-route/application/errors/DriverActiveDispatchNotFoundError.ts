export class DriverActiveDispatchNotFoundError extends Error {
  constructor() {
    super("Driver active dispatch not found");
    this.name = "DriverActiveDispatchNotFoundError";
  }
}
