import {
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/src/whatsappApi";

const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_EN =
  "HXa1728d7711e5ea52947eed912d6ec611";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_PT =
  "HX5a5bc294ff63f75e3eff2ab5a37001a4";
const DEFAULT_TWILIO_FEEDBACK_TEMPLATE_SID_ES =
  "HX2439261ac2def9cb76cae135733fba25";

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

function resolveFeedbackVariableKey(): string {
  const configuredKey =
    process.env.TWILIO_FEEDBACK_TEMPLATE_VARIABLE_KEY?.trim() || "1";
  return configuredKey.length > 0 ? configuredKey : "1";
}

function resolveFeedbackVariableValue(input: {
  orderId: string;
  language?: string | null;
}): string {
  const language = normalizeLanguageForTemplate(input.language);
  const defaultTemplate = "{orderId}";
  const template =
    process.env.TWILIO_FEEDBACK_TEMPLATE_VARIABLE_VALUE_TEMPLATE?.trim() ||
    defaultTemplate;

  return template
    .replaceAll("{orderId}", String(input.orderId))
    .replaceAll("{language}", language);
}

export default async function sendFeedbackWhatsAppMessage(input: {
  customerPhone: string;
  orderId: string;
  language?: string | null;
}) {
  const templateLanguage = normalizeLanguageForTemplate(input.language);
  const templateSid = resolveFeedbackTemplateSid(templateLanguage);
  const configuredVariableKey = resolveFeedbackVariableKey();
  const configuredVariableValue = resolveFeedbackVariableValue(input);

  try {
    if (templateSid) {
      await sendWhatsAppTemplateMessage({
        customerPhone: input.customerPhone,
        contentSid: templateSid,
        contentVariables: {
          [configuredVariableKey]: configuredVariableValue,
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
