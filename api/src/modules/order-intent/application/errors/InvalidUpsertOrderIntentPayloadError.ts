export class InvalidUpsertOrderIntentPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid upsert order intent payload: ${field}`);
    this.name = "InvalidUpsertOrderIntentPayloadError";
  }
}

