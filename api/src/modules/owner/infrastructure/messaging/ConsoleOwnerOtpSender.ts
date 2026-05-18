import type { OwnerOtpSender, SendOwnerOtpInput } from "../../application/ports/OwnerOtpSender.js";

export class ConsoleOwnerOtpSender implements OwnerOtpSender {
  async send(input: SendOwnerOtpInput): Promise<void> {
    const shouldLog = process.env.OWNER_OTP_LOG_CODES !== "false";

    if (shouldLog) {
      console.info(
        `[owner-otp] code generated phone=${input.phone} code=${input.code} language=${input.language ?? "n/a"}`,
      );
    }
  }
}
