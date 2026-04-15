import type { TOrderType } from "../types/order";

export type WhatsAppMessageLanguage = "en" | "pt" | "es";

type OrderConfirmedMessageInput = {
  customerName?: string | null;
  orderNumber?: string | null;
  totalInCents: number;
  orderType: TOrderType;
};

type DispatchDispatchedMessageInput = {
  etaFromMinutes: number;
  etaToMinutes: number;
};

type WhatsAppMessageTemplates = {
  orderConfirmed: (input: OrderConfirmedMessageInput) => string;
  dispatchDispatched: (input: DispatchDispatchedMessageInput) => string;
};

const DEFAULT_LANGUAGE: WhatsAppMessageLanguage = "en";

const whatsappMessageTemplates: Record<
  WhatsAppMessageLanguage,
  WhatsAppMessageTemplates
> = {
  en: {
    orderConfirmed: ({ customerName, orderNumber, totalInCents, orderType }) =>
      [
        "🍕 Order Confirmed!",
        "",
        `Hi ${customerName || "there"}! Your order has been received 🙌`,
        "",
        `🧾 Order #: ${orderNumber || "-"}`,
        `💰 Total: $${formatTotalAmount(totalInCents)}`,
        `📍 Type: ${getOrderTypeLabel("en", orderType)}`,
        "",
        "We're already preparing your order 🔥",
        "We'll let you know when it's ready!",
        "",
        "Thanks for choosing Zaatar Grill & Pizza! ❤️",
      ].join("\n"),
    dispatchDispatched: ({ etaFromMinutes, etaToMinutes }) =>
      [
        "🚗 Your order is on the way! 🍕",
        "",
        `ETA: ${formatEtaRangeLabel(etaFromMinutes, etaToMinutes)}`,
        "",
        "See you soon! 👋",
      ].join("\n"),
  },
  pt: {
    orderConfirmed: ({ customerName, orderNumber, totalInCents, orderType }) =>
      [
        "🍕 Pedido Confirmado!",
        "",
        `Oi ${customerName || "cliente"}! Seu pedido foi recebido 🙌`,
        "",
        `🧾 Pedido #: ${orderNumber || "-"}`,
        `💰 Total: $${formatTotalAmount(totalInCents)}`,
        `📍 Tipo: ${getOrderTypeLabel("pt", orderType)}`,
        "",
        "Ja estamos preparando seu pedido 🔥",
        "Vamos avisar quando estiver pronto!",
        "",
        "Obrigado por escolher Zaatar Grill & Pizza! ❤️",
      ].join("\n"),
    dispatchDispatched: ({ etaFromMinutes, etaToMinutes }) =>
      [
        "🚗 Seu pedido esta a caminho! 🍕",
        "",
        `ETA: ${formatEtaRangeLabel(etaFromMinutes, etaToMinutes)}`,
        "",
        "Ate ja! 👋",
      ].join("\n"),
  },
  es: {
    orderConfirmed: ({ customerName, orderNumber, totalInCents, orderType }) =>
      [
        "🍕 Pedido Confirmado!",
        "",
        `Hola ${customerName || "cliente"}! Tu pedido ha sido recibido 🙌`,
        "",
        `🧾 Pedido #: ${orderNumber || "-"}`,
        `💰 Total: $${formatTotalAmount(totalInCents)}`,
        `📍 Tipo: ${getOrderTypeLabel("es", orderType)}`,
        "",
        "Ya estamos preparando tu pedido 🔥",
        "Te avisaremos cuando este listo!",
        "",
        "Gracias por elegir Zaatar Grill & Pizza! ❤️",
      ].join("\n"),
    dispatchDispatched: ({ etaFromMinutes, etaToMinutes }) =>
      [
        "🚗 Tu pedido va en camino! 🍕",
        "",
        `ETA: ${formatEtaRangeLabel(etaFromMinutes, etaToMinutes)}`,
        "",
        "Nos vemos pronto! 👋",
      ].join("\n"),
  },
};

function formatTotalAmount(totalInCents: number): string {
  if (!Number.isFinite(totalInCents)) {
    return "0.00";
  }

  return (Math.max(totalInCents, 0) / 100).toFixed(2);
}

function normalizeEtaMinutes(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.ceil(value));
}

function formatEtaRangeLabel(etaFromMinutes: number, etaToMinutes: number): string {
  return `${etaFromMinutes}-${etaToMinutes} min`;
}

function getOrderTypeLabel(
  language: WhatsAppMessageLanguage,
  orderType: TOrderType,
): string {
  if (language === "pt") {
    return orderType === "DELIVERY" ? "Entrega" : "Retirada";
  }

  if (language === "es") {
    return orderType === "DELIVERY" ? "Entrega" : "Recogida";
  }

  return orderType === "DELIVERY" ? "Delivery" : "Pickup";
}

function normalizeLanguage(value: string | null | undefined): WhatsAppMessageLanguage {
  if (!value) return DEFAULT_LANGUAGE;

  const normalizedValue = value.trim().toLowerCase();
  const baseLanguage = normalizedValue.split("-")[0];

  if (
    baseLanguage === "en" ||
    baseLanguage === "pt" ||
    baseLanguage === "es"
  ) {
    return baseLanguage;
  }

  return DEFAULT_LANGUAGE;
}

export function getOrderConfirmedWhatsAppMessage(input: {
  language?: string | null;
  customerName?: string | null;
  orderNumber?: string | null;
  totalInCents: number;
  orderType: TOrderType;
}) {
  const language = normalizeLanguage(input.language);

  return whatsappMessageTemplates[language].orderConfirmed({
    customerName: input.customerName,
    orderNumber: input.orderNumber,
    totalInCents: input.totalInCents,
    orderType: input.orderType,
  });
}

export function getDispatchDispatchedWhatsAppMessage(input: {
  language?: string | null;
  estimatedDeliveryDurationMinutes?: number | null;
}) {
  const language = normalizeLanguage(input.language);
  const etaFromMinutes = normalizeEtaMinutes(
    input.estimatedDeliveryDurationMinutes,
  );
  const etaToMinutes = etaFromMinutes + 10;

  return whatsappMessageTemplates[language].dispatchDispatched({
    etaFromMinutes,
    etaToMinutes,
  });
}
