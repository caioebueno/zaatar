export class DispatchRouteSessionNotFoundError extends Error {
  constructor() {
    super("Dispatch route session not found");
    this.name = "DispatchRouteSessionNotFoundError";
  }
}

