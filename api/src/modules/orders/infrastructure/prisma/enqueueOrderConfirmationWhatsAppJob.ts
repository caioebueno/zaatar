import { randomUUID } from "node:crypto";
import type { Prisma } from "../../../../../../web/src/generated/prisma/index.js";

/** Queues the confirmation template; Chatwoot I/O is owned by queue-worker. */
export async function enqueueOrderConfirmationWhatsAppJob(
  tx: Prisma.TransactionClient,
  input: {
    branchId: string | null | undefined;
    customerPhone: string | null | undefined;
    orderId: string;
  },
): Promise<void> {
  const customerPhone = input.customerPhone?.trim();
  const branchId = input.branchId?.trim();

  if (!customerPhone || !branchId) {
    console.info(
      `[order-confirmation] skipped enqueue order=${input.orderId} reason=${!customerPhone ? "MISSING_CUSTOMER_PHONE" : "MISSING_BRANCH"}`,
    );
    return;
  }

  const inserted = await tx.$executeRaw`
    INSERT INTO "DispatchWhatsAppJob" ("id", "orderId", "kind")
    VALUES (${randomUUID()}, ${input.orderId}, ${"order_confirmation"})
    ON CONFLICT ("orderId", "kind") DO NOTHING
  `;

  console.info(
    `[order-confirmation] enqueue-complete order=${input.orderId} inserted=${inserted === 1}`,
  );
}
