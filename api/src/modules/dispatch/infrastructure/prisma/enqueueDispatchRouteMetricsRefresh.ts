import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";

type PrismaExecutor = Prisma.TransactionClient | typeof prisma;

export async function enqueueDispatchRouteMetricsRefresh(
  dispatchId: string | null | undefined,
  executor: PrismaExecutor = prisma,
): Promise<void> {
  const normalizedDispatchId = dispatchId?.trim();
  if (!normalizedDispatchId) return;

  const now = new Date();

  await executor.$executeRaw`
    INSERT INTO "DispatchRouteMetricsRefreshJob" (
      "id",
      "createdAt",
      "updatedAt",
      "dispatchId",
      "status",
      "availableAt"
    )
    VALUES (
      ${randomUUID()},
      ${now},
      ${now},
      ${normalizedDispatchId},
      'PENDING'::"DispatchRouteMetricsRefreshJobStatus",
      ${now}
    )
    ON CONFLICT ("dispatchId")
    DO UPDATE SET
      "status" = 'PENDING'::"DispatchRouteMetricsRefreshJobStatus",
      "availableAt" = NOW(),
      "processingStartedAt" = NULL,
      "completedAt" = NULL,
      "lastError" = NULL,
      "updatedAt" = NOW()
  `;
}
