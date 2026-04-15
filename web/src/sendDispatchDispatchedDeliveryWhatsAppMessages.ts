import prisma from "@/prisma";
import type { Dispatch } from "@/src/modules/dispatch/domain/dispatch.types";
import { getDispatchDispatchedWhatsAppMessage } from "@/src/constants/whatsappMessages";
import { sendWhatsAppTextMessage } from "@/src/whatsappApi";

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

      const message = getDispatchDispatchedWhatsAppMessage({
        language: order.language,
        estimatedDeliveryDurationMinutes:
          order.estimatedDeliveryDurationMinutes ??
          dispatch.estimatedDeliveryDurationMinutes ??
          null,
      });

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
