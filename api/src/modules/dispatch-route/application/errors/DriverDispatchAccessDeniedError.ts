export class DriverDispatchAccessDeniedError extends Error {
  constructor() {
    super("Driver does not have access to this dispatch");
    this.name = "DriverDispatchAccessDeniedError";
  }
}

