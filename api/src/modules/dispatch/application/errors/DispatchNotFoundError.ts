export class DispatchNotFoundError extends Error {
  constructor() {
    super("Dispatch not found");
    this.name = "DispatchNotFoundError";
  }
}

