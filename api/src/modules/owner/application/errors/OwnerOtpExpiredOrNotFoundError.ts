export class OwnerOtpExpiredOrNotFoundError extends Error {
  constructor() {
    super("Owner OTP expired or not found");
    this.name = "OwnerOtpExpiredOrNotFoundError";
  }
}

