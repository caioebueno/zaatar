import prisma from "@/prisma";
import type { Dispatch } from "@/src/modules/dispatch/domain/dispatch.types";
import { getDispatchDispatchedWhatsAppMessage } from "@/src/constants/whatsappMessages";
import {
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
} from "@/src/whatsappApi";

const DEFAULT_TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_EN =
  "HXf2aa80f481c4bff1e7dc3e4de158bbc8";
const DEFAULT_TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_PT =
  "HX5c0e3ce4cf05ec70173c9647c21e5de3";
const DEFAULT_TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_ES =
  "HXea4bc246eebf9a1d079fb29e7b5879f0";

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

function resolveDispatchDispatchedTemplateSid(
  language: "en" | "pt" | "es",
): string {
  if (language === "pt") {
    return (
      process.env.TWILIO_OUT_FOR_DELIVERY_TEMPLATE_SID_PT?.trim() ||
      process.env.TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_PT?.trim() ||
      DEFAULT_TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_PT
    );
  }

  if (language === "es") {
    return (
      process.env.TWILIO_OUT_FOR_DELIVERY_TEMPLATE_SID_ES?.trim() ||
      process.env.TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_ES?.trim() ||
      DEFAULT_TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_ES
    );
  }

  return (
    process.env.TWILIO_OUT_FOR_DELIVERY_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_OUT_FOR_DELIVERY_TEMPLATE_SID?.trim() ||
    process.env.TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_EN?.trim() ||
    process.env.TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID?.trim() ||
    DEFAULT_TWILIO_DISPATCH_DISPATCHED_TEMPLATE_SID_EN
  );
}

function toEtaRangeLabel(estimatedDeliveryDurationMinutes: number | null | undefined): string {
  const etaFromMinutes = Math.max(
    0,
    Math.ceil(Number.isFinite(estimatedDeliveryDurationMinutes) ? Number(estimatedDeliveryDurationMinutes) : 0),
  );
  const etaToMinutes = etaFromMinutes + 10;
  return `${etaFromMinutes}-${etaToMinutes} min`;
}

export default async function sendDispatchDispatchedDeliveryWhatsAppMessages(
  dispatch: Dispatch,
): Promise<void> {
  const deliveryOrders = dispatch.orders.filter(
    (order) => order.type === "DELIVERY" && !order.delivered && !!order.costumerId,
  );

  if (deliveryOrders.length === 0) {
    return;
  }

  const customerIds = Array.from(
    new Set(
      deliveryOrders
        .map((order) => order.costumerId)
        .filter((customerId): customerId is string => Boolean(customerId)),
    ),
  );

  if (customerIds.length === 0) {
    return;
  }

  const customers = await prisma.customer.findMany({
    where: {
      id: {
        in: customerIds,
      },
    },
    select: {
      id: true,
      phone: true,
    },
  });
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));

  const results = await Promise.allSettled(
    deliveryOrders.map(async (order) => {
      if (!order.costumerId) return;

      const customer = customerById.get(order.costumerId);
      const customerPhone = customer?.phone?.trim();

      if (!customerPhone) return;

      const templateLanguage = normalizeLanguageForTemplate(order.language);
      const templateSid = resolveDispatchDispatchedTemplateSid(templateLanguage);
      const etaRangeLabel = toEtaRangeLabel(
        order.estimatedDeliveryDurationMinutes ??
          dispatch.estimatedDeliveryDurationMinutes ??
          null,
      );
      const message = getDispatchDispatchedWhatsAppMessage({
        language: order.language,
        estimatedDeliveryDurationMinutes:
          order.estimatedDeliveryDurationMinutes ??
          dispatch.estimatedDeliveryDurationMinutes ??
          null,
      });

      if (templateSid) {
        await sendWhatsAppTemplateMessage({
          customerPhone,
          contentSid: templateSid,
          contentVariables: {
            "1": etaRangeLabel,
          },
        });
        return;
      }

      await sendWhatsAppTextMessage({
        customerPhone,
        content: message,
      });
    }),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Failed to send dispatch dispatched WhatsApp message:",
        result.reason,
      );
    }
  });
}
