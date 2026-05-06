"use server";

import { randomUUID } from "crypto";
import prisma from "@/prisma";

type EnqueueFeedbackWhatsAppJobInput = {
  orderId: string;
  deliveredAt: Date;
};

function getFeedbackDelayInMinutes(): number {
  const rawDelay = process.env.FEEDBACK_WHATSAPP_DELAY_MINUTES?.trim();

  if (!rawDelay) return 30;

  const parsed = Number.parseInt(rawDelay, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return 30;

  return parsed;
}

export default async function enqueueFeedbackWhatsAppJob(
  input: EnqueueFeedbackWhatsAppJobInput,
): Promise<void> {
  const [orderRow] = await prisma.$queryRaw<
    { customerPhone: string | null; language: string | null }[]
  >`
    SELECT
      customer."phone" AS "customerPhone",
      orders."language" AS "language"
    FROM "Order" orders
    LEFT JOIN "Customer" customer ON customer."id" = orders."customerId"
    WHERE orders."id" = ${input.orderId}
    LIMIT 1
  `;

  const customerPhone = orderRow?.customerPhone?.trim();

  if (!customerPhone) {
    console.log(
      `[feedback-whatsapp] skipped enqueue: missing customer phone for order=${input.orderId}`,
    );
    return;
  }

  const delayInMinutes = getFeedbackDelayInMinutes();
  const availableAt = new Date(
    input.deliveredAt.getTime() + delayInMinutes * 60 * 1000,
  );

  await prisma.$executeRaw`
    INSERT INTO "FeedbackWhatsAppJob" (
      "id",
      "orderId",
      "customerPhone",
      "language",
      "availableAt"
    )
    VALUES (
      ${randomUUID()},
      ${input.orderId},
      ${customerPhone},
      ${orderRow?.language ?? null},
      ${availableAt}
    )
    ON CONFLICT ("orderId")
    DO UPDATE SET
      "customerPhone" = EXCLUDED."customerPhone",
      "language" = EXCLUDED."language",
      "status" = 'PENDING',
      "availableAt" = EXCLUDED."availableAt",
      "lastError" = NULL,
      "completedAt" = NULL,
      "processingStartedAt" = NULL
  `;

  console.log(
    `[feedback-whatsapp] enqueued order=${input.orderId} availableAt=${availableAt.toISOString()} delayMinutes=${delayInMinutes}`,
  );
}
