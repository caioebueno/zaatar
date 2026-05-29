export class OrderIntentBranchNotFoundError extends Error {
  constructor() {
    super("Branch not found");
    this.name = "OrderIntentBranchNotFoundError";
  }
}

