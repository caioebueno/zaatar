import { normalizePhoneWithCountryCode } from "./phone";

function isWhatsAppMessagingDisabled(): boolean {
  const rawValue = process.env.DISABLE_WHATSAPP_MESSAGING?.trim().toLowerCase();
  return (
    rawValue === "1" ||
    rawValue === "true" ||
    rawValue === "yes" ||
    rawValue === "on"
  );
}

export function toWhatsAppAddress(phone: string): string | undefined {
  const countryCode = (
    process.env.WHATSAPP_COUNTRY_CODE?.trim() || "1"
  ).replace(/\D/g, "");

  const phoneWithCountryCode = normalizePhoneWithCountryCode(phone, countryCode);
  if (!phoneWithCountryCode) return undefined;

  return `whatsapp:+${phoneWithCountryCode}`;
}

function getTwilioConfig(): {
  accountSid: string;
  authToken: string;
  messagingServiceSid: string;
  fromWhatsAppAddress: string;
  baseUrl: string;
} | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const fromWhatsAppAddress =
    process.env.TWILIO_WHATSAPP_FROM?.trim() ||
    process.env.TWILIO_WHATSAPP_NUMBER?.trim() ||
    process.env.WHATSAPP_FROM?.trim() ||
    "";

  if (!accountSid || !authToken) {
    console.warn(
      "Skipping WhatsApp message: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN are not configured.",
    );
    return null;
  }

  if (!messagingServiceSid && !fromWhatsAppAddress) {
    console.warn(
      "Skipping WhatsApp message: configure TWILIO_MESSAGING_SERVICE_SID or TWILIO_WHATSAPP_FROM.",
    );
    return null;
  }

  const baseUrl = (
    process.env.TWILIO_API_BASE_URL?.trim() || "https://api.twilio.com"
  ).replace(/\/$/, "");

  return {
    accountSid,
    authToken,
    messagingServiceSid: messagingServiceSid ?? "",
    fromWhatsAppAddress,
    baseUrl,
  };
}

async function sendTwilioWhatsAppMessage(input: {
  customerPhone: string;
  body?: string;
  contentSid?: string;
  contentVariables?: Record<string, string>;
}): Promise<void> {
  if (isWhatsAppMessagingDisabled()) {
    console.info(
      "Skipping WhatsApp message: DISABLE_WHATSAPP_MESSAGING is enabled.",
    );
    return;
  }

  const config = getTwilioConfig();
  if (!config) return;

  const toAddress = toWhatsAppAddress(input.customerPhone);
  if (!toAddress) return;

  const endpoint = `${config.baseUrl}/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const params = new URLSearchParams({
    To: toAddress,
  });

  if (input.contentSid) {
    params.set("ContentSid", input.contentSid);
    if (input.contentVariables && Object.keys(input.contentVariables).length > 0) {
      params.set("ContentVariables", JSON.stringify(input.contentVariables));
    }
  } else if (input.body) {
    params.set("Body", input.body);
  } else {
    throw new Error("Twilio WhatsApp message must include body or contentSid");
  }

  if (config.messagingServiceSid) {
    params.set("MessagingServiceSid", config.messagingServiceSid);
  } else if (config.fromWhatsAppAddress) {
    params.set("From", config.fromWhatsAppAddress);
  }

  const authorization = `Basic ${Buffer.from(
    `${config.accountSid}:${config.authToken}`,
  ).toString("base64")}`;

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

export async function sendWhatsAppTextMessage(input: {
  content: string;
  customerPhone: string;
}): Promise<void> {
  await sendTwilioWhatsAppMessage({
    customerPhone: input.customerPhone,
    body: input.content,
  });
}

export async function sendWhatsAppTemplateMessage(input: {
  customerPhone: string;
  contentSid: string;
  contentVariables?: Record<string, string>;
}): Promise<void> {
  await sendTwilioWhatsAppMessage({
    customerPhone: input.customerPhone,
    contentSid: input.contentSid,
    contentVariables: input.contentVariables,
  });
}
