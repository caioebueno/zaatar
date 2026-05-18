import type { OwnerOtpSender, SendOwnerOtpInput } from "../../application/ports/OwnerOtpSender.js";

function resolveTwilioVerifyBaseUrl(): string {
  return (
    process.env.TWILIO_VERIFY_API_BASE_URL?.trim() || "https://verify.twilio.com"
  ).replace(/\/$/, "");
}

function resolveTwilioAuth(): { accountSid: string; authToken: string } {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are not configured");
  }

  return { accountSid, authToken };
}

function normalizeTemplateLanguage(value: string | undefined): "en" | "pt" | "es" {
  const normalized = (value || "").trim().toLowerCase();
  const baseLanguage = normalized.split("-")[0];

  if (baseLanguage === "pt" || baseLanguage === "es") {
    return baseLanguage;
  }

  return "en";
}

export class TwilioOwnerOtpSender implements OwnerOtpSender {
  async send(input: SendOwnerOtpInput): Promise<void> {
    const { accountSid, authToken } = resolveTwilioAuth();
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

    if (!verifyServiceSid) {
      throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured");
    }

    const endpoint = `${resolveTwilioVerifyBaseUrl()}/v2/Services/${verifyServiceSid}/Verifications`;
    const locale = normalizeTemplateLanguage(input.language);

    const params = new URLSearchParams({
      To: `+${input.phone}`,
      Channel: "sms",
      CustomCode: input.code,
      Locale: locale,
    });

    const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authorization,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `Twilio Verify SMS API request failed (${response.status}): ${errorBody}`,
      );
    }
  }
}

