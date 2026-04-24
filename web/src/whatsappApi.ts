import { normalizePhoneWithCountryCode } from "./phone";

export function toWhatsAppChatId(phone: string): string | undefined {
  const countryCode = (
    process.env.WHATSAPP_COUNTRY_CODE?.trim() || "1"
  ).replace(/\D/g, "");

  const phoneWithCountryCode = normalizePhoneWithCountryCode(phone, countryCode);
  if (!phoneWithCountryCode) return undefined;

  return `${phoneWithCountryCode}@c.us`;
}

export async function sendWhatsAppTextMessage(input: {
  content: string;
  customerPhone: string;
}): Promise<void> {
  const sessionId = process.env.WHATSAPP_SESSION_ID?.trim();

  if (!sessionId) {
    console.warn(
      "Skipping WhatsApp message: WHATSAPP_SESSION_ID is not configured.",
    );
    return;
  }

  const chatId = toWhatsAppChatId(input.customerPhone);
  if (!chatId) return;

  const baseUrl = (
    process.env.WHATSAPP_API_BASE_URL?.trim() || "http://localhost:4000"
  ).replace(/\/$/, "");
  const endpoint = `${baseUrl}/client/sendMessage/${sessionId}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.WHATSAPP_API_KEY) {
    headers["x-api-key"] = process.env.WHATSAPP_API_KEY;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      chatId,
      contentType: "string",
      content: input.content,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");

    throw new Error(
      `WhatsApp API request failed (${response.status}): ${errorBody}`,
    );
  }
}
