export class DriverOtpInvalidError extends Error {
  constructor(public readonly remainingAttempts: number) {
    super("DRIVER_OTP_INVALID");
    this.name = "DriverOtpInvalidError";
  }
}
