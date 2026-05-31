export class BranchChatwootConfigMissingError extends Error {
  constructor(
    public readonly field:
      | "chatwootAccountId"
      | "chatwootSourceId"
      | "chatwootAgentId",
  ) {
    super(`Branch is missing Chatwoot config field: ${field}`);
    this.name = "BranchChatwootConfigMissingError";
  }
}
