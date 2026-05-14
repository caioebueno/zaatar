export class BranchNotFoundError extends Error {
  constructor() {
    super("BRANCH_NOT_FOUND");
    this.name = "BranchNotFoundError";
  }
}
