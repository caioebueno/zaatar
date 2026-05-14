export class InvalidOnboardingPayloadError extends Error {
  constructor(public readonly field: string) {
    super(`INVALID_ONBOARDING_PAYLOAD:${field}`);
    this.name = "InvalidOnboardingPayloadError";
  }
}
