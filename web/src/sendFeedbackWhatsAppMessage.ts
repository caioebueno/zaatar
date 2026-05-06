import {
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/src/whatsappApi";

const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_EN =
  "HXaf24fd36c9b384c0d481b79cbb9ac3d1";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_PT =
  "HXf431688a42986b9789d51c36509d5fea";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_ES =
  "HX31a99745530e5c4083a657ed30a61dea";

function normalizeLanguageForTemplate(
  value: string | null | undefined,
): "en" | "pt" | "es" {
  const normalizedValue = (value || "").trim().toLowerCase();
  const baseLanguage = normalizedValue.split("-")[0];

  if (baseLanguage === "pt" || baseLanguage === "es") {
    return baseLanguage;
  }

  return "en";
}

function resolveFeedbackTemplateSid(language: "en" | "pt" | "es"): string {
  if (language === "pt") {
    return (
      process.env.TWILIO_FEEDBACK_TEMPLATE_SID_PT?.trim() ||
      DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_PT
    );
  }

  if (language === "es") {
    return (
      process.env.TWILIO_FEEDBACK_TEMPLATE_SID_ES?.trim() ||
      DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_ES
    );
  }

  return (
    process.env.TWILIO_FEEDBACK_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_FEEDBACK_TEMPLATE_SID?.trim() ||
    DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_EN
  );
}

export default async function sendFeedbackWhatsAppMessage(input: {
  customerPhone: string;
  orderId: string;
  language?: string | null;
}) {
  const templateLanguage = normalizeLanguageForTemplate(input.language);
  const templateSid = resolveFeedbackTemplateSid(templateLanguage);

  try {
    if (templateSid) {
      await sendWhatsAppTemplateMessage({
        customerPhone: input.customerPhone,
        contentSid: templateSid,
        contentVariables: {
          "1": input.orderId,
        },
      });
      return;
    }

    await sendWhatsAppTextMessage({
      customerPhone: input.customerPhone,
      content: `Please share your feedback for order ${input.orderId}.`,
    });
  } catch (error) {
    console.error("Failed to send feedback WhatsApp message:", error);
  }
}

