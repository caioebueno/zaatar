import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";

function getFeedbackDelayInMinutes(): number {
  const rawDelay = process.env.FEEDBACK_WHATSAPP_DELAY_MINUTES?.trim();
  if (!rawDelay) return 30;

  const delay = Number.parseInt(rawDelay, 10);
  return Number.isInteger(delay) && delay >= 1 ? delay : 30;
}

/**
 * Schedules the post-delivery WhatsApp request consumed by the queue-worker.
 * Call this only for the null -> date deliveredAt transition.
 */
export async function enqueueFeedbackWhatsAppJob(input: {
  deliveredAt: Date;
  orderId: string;
}): Promise<void> {
  const [order] = await prisma.$queryRaw<
    Array<{ customerPhone: string | null; language: string | null }>
  >`
    SELECT
      customer."phone" AS "customerPhone",
      orders."language" AS "language"
    FROM "Order" orders
    LEFT JOIN "Customer" customer ON customer."id" = orders."customerId"
    WHERE orders."id" = ${input.orderId}
    LIMIT 1
  `;

  const customerPhone = order?.customerPhone?.trim();
  if (!customerPhone) {
    console.info(
      `[feedback-whatsapp] skipped enqueue: missing customer phone for order=${input.orderId}`,
    );
    return;
  }

  const availableAt = new Date(
    input.deliveredAt.getTime() + getFeedbackDelayInMinutes() * 60 * 1000,
  );

  await prisma.$executeRaw`
    INSERT INTO "FeedbackWhatsAppJob" (
      "id", "orderId", "customerPhone", "language", "availableAt"
    )
    VALUES (
      ${randomUUID()},
      ${input.orderId},
      ${customerPhone},
      ${order?.language ?? null},
      ${availableAt}
    )
    ON CONFLICT ("orderId") DO NOTHING
  `;

  console.info(
    `[feedback-whatsapp] enqueued order=${input.orderId} availableAt=${availableAt.toISOString()}`,
  );
}
