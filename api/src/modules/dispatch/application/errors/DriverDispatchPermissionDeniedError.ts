export class DriverDispatchPermissionDeniedError extends Error {
  constructor() {
    super("Driver does not have access to this dispatch");
    this.name = "DriverDispatchPermissionDeniedError";
  }
}

