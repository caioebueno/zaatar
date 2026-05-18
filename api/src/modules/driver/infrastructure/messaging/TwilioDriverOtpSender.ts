import type {
  DriverOtpSender,
  SendDriverOtpMessageInput,
} from "../../application/ports/DriverOtpSender.js";

const DEFAULT_TEMPLATE_SID_EN = "HX7d3c229f202570036c7838d8951ac1d7";
const DEFAULT_TEMPLATE_SID_ES = "HX0dcdfc25d4e6dc915a570ef56f1354c2";
const DEFAULT_TEMPLATE_SID_PT = "HX91a939302f70b34982dc0a929bd52212";

export class TwilioDriverOtpSender implements DriverOtpSender {
  async send(input: SendDriverOtpMessageInput): Promise<void> {
    const sendViaSms = async () => {
      await sendTwilioVerifySmsMessage({
        phone: input.phone,
        code: input.code,
        language: input.language,
      });
    };

    const sendViaWhatsApp = async () => {
      const contentSid = resolveDriverOtpTemplateSid(input.language);
      await sendWhatsAppTemplateMessage({
        customerPhone: input.phone,
        contentSid,
        contentVariables: {
          "1": input.code,
        },
      });
    };

    if (input.channel === "SMS") {
      await sendViaSms();
    } else {
      await sendViaWhatsApp();
    }

    if (input.sendAlsoSms && input.channel !== "SMS") {
      try {
        await sendViaSms();
      } catch (error) {
        console.error("Driver OTP SMS secondary channel failed:", error);
      }
    }

    if (input.sendAlsoWhatsApp && input.channel !== "WHATSAPP") {
      try {
        await sendViaWhatsApp();
      } catch (error) {
        console.error("Driver OTP WhatsApp secondary channel failed:", error);
      }
    }
  }
}

function normalizeTemplateLanguage(value: string | undefined): "en" | "pt" | "es" {
  const normalized = (value || "").trim().toLowerCase();
  const baseLanguage = normalized.split("-")[0];

  if (baseLanguage === "pt" || baseLanguage === "es") {
    return baseLanguage;
  }

  return "en";
}

function resolveDriverOtpTemplateSid(language: string | undefined): string {
  const normalizedLanguage = normalizeTemplateLanguage(language);

  if (normalizedLanguage === "pt") {
    return (
      process.env.TWILIO_DRIVER_OTP_TEMPLATE_SID_PT?.trim() ||
      process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID_PT?.trim() ||
      DEFAULT_TEMPLATE_SID_PT
    );
  }

  if (normalizedLanguage === "es") {
    return (
      process.env.TWILIO_DRIVER_OTP_TEMPLATE_SID_ES?.trim() ||
      process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID_ES?.trim() ||
      DEFAULT_TEMPLATE_SID_ES
    );
  }

  return (
    process.env.TWILIO_DRIVER_OTP_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_DRIVER_OTP_TEMPLATE_SID?.trim() ||
    process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_CUSTOMER_OTP_TEMPLATE_SID?.trim() ||
    DEFAULT_TEMPLATE_SID_EN
  );
}

function isWhatsAppMessagingDisabled(): boolean {
  const rawValue = process.env.DISABLE_WHATSAPP_MESSAGING?.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(rawValue || "");
}

function resolveTwilioBaseUrl(): string {
  return (process.env.TWILIO_API_BASE_URL?.trim() || "https://api.twilio.com").replace(
    /\/$/,
    "",
  );
}

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

async function sendTwilioVerifySmsMessage(input: {
  phone: string;
  code: string;
  language?: string;
}) {
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

async function sendWhatsAppTemplateMessage(input: {
  contentSid: string;
  contentVariables: Record<string, string>;
  customerPhone: string;
}) {
  if (isWhatsAppMessagingDisabled()) {
    return;
  }

  const { accountSid, authToken } = resolveTwilioAuth();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || "";
  const fromWhatsAppAddress =
    process.env.TWILIO_WHATSAPP_FROM?.trim() ||
    process.env.TWILIO_WHATSAPP_NUMBER?.trim() ||
    process.env.WHATSAPP_FROM?.trim() ||
    "";

  if (!messagingServiceSid && !fromWhatsAppAddress) {
    throw new Error(
      "Configure TWILIO_MESSAGING_SERVICE_SID or TWILIO_WHATSAPP_FROM for WhatsApp OTP",
    );
  }

  const params = new URLSearchParams({
    To: `whatsapp:+${input.customerPhone}`,
    ContentSid: input.contentSid,
    ContentVariables: JSON.stringify(input.contentVariables),
  });

  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else {
    params.set("From", fromWhatsAppAddress);
  }

  const endpoint = `${resolveTwilioBaseUrl()}/2010-04-01/Accounts/${accountSid}/Messages.json`;
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
      `Twilio WhatsApp API request failed (${response.status}): ${errorBody}`,
    );
  }
}
