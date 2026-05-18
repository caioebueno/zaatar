export class InvalidOwnerAuthPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`Invalid owner auth payload field: ${field}`);
    this.name = "InvalidOwnerAuthPayloadError";
  }
}

