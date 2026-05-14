export class DriverOtpExpiredOrNotFoundError extends Error {
  constructor() {
    super("DRIVER_OTP_EXPIRED_OR_NOT_FOUND");
    this.name = "DriverOtpExpiredOrNotFoundError";
  }
}
