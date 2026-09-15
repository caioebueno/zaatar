import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type { DispatchEntity } from "../../application/ports/DispatchRepository.js";
import type { OutForDeliveryNotifier } from "../../application/ports/OutForDeliveryNotifier.js";

/** Queues customer dispatch notifications; the queue-worker performs Chatwoot I/O. */
export class DispatchWhatsAppJobScheduler implements OutForDeliveryNotifier {
  async sendForDispatch(dispatch: DispatchEntity): Promise<void> {
    const kind = dispatch.orders.some((order) => order.type === "TAKEAWAY")
      ? "ready_for_pickup"
      : "out_for_delivery";
    const targetType = kind === "ready_for_pickup" ? "TAKEAWAY" : "DELIVERY";
    const orderIds = dispatch.orders
      .filter((order) => order.type === targetType && !order.delivered && Boolean(order.customer?.phone?.trim()))
      .map((order) => order.id);

    if (orderIds.length === 0) return;
    for (const orderId of orderIds) {
      await prisma.$executeRaw`
        INSERT INTO "DispatchWhatsAppJob" ("id", "orderId", "kind")
        VALUES (${randomUUID()}, ${orderId}, ${kind})
        ON CONFLICT ("orderId", "kind") DO NOTHING
      `;
    }
    console.info(`[dispatch-notification] queued dispatch=${dispatch.id} kind=${kind} orderCount=${orderIds.length}`);
  }
}
