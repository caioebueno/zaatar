export class DispatchRouteSessionClosedError extends Error {
  constructor() {
    super("Dispatch route session is already closed");
    this.name = "DispatchRouteSessionClosedError";
  }
}

