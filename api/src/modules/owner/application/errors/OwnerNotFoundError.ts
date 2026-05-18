export class OwnerNotFoundError extends Error {
  constructor() {
    super("Owner not found");
    this.name = "OwnerNotFoundError";
  }
}

