export class InvalidBusinessSettingsPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid business settings payload: ${field}`);
    this.name = "InvalidBusinessSettingsPayloadError";
  }
}
