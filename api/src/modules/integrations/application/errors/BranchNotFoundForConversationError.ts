export class BranchNotFoundForConversationError extends Error {
  constructor() {
    super("Branch not found for conversation query");
    this.name = "BranchNotFoundForConversationError";
  }
}

