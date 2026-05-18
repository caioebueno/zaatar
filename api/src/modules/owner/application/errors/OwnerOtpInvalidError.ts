export class OwnerOtpInvalidError extends Error {
  constructor(public readonly remainingAttempts: number) {
    super("Invalid owner OTP code");
    this.name = "OwnerOtpInvalidError";
  }
}

