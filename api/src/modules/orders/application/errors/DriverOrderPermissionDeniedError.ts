export class DriverOrderPermissionDeniedError extends Error {
  constructor() {
    super("DRIVER_ORDER_PERMISSION_DENIED");
    this.name = "DriverOrderPermissionDeniedError";
  }
}
