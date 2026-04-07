import { randomUUID } from "crypto";
import prisma from "@/prisma";
import { assignDeliveryOrderToDispatchUseCase } from "./assignDeliveryOrderToDispatch";
import { prismaDispatchRepository } from "../infrastructure/prisma/prismaDispatchRepository";

type AssignDeliveryOrderToDispatchJob = {
  orderId: string;
  deliveryAddressId: string;
};

type DispatchAssignmentJobRow = {
  id: string;
  orderId: string;
  deliveryAddressId: string;
  attempts: number;
};

const MAX_JOBS_PER_RUN = 10;

function normalizeJob(data: AssignDeliveryOrderToDispatchJob) {
  const orderId = data.orderId.trim();
  const deliveryAddressId = data.deliveryAddressId.trim();

  if (!orderId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "orderId",
      },
    };
  }

  if (!deliveryAddressId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "deliveryAddressId",
      },
    };
  }

  return {
    orderId,
    deliveryAddressId,
  };
}

function getRetryDate(attempts: number): Date {
  const delayInSeconds = Math.min(30 * 2 ** Math.max(attempts - 1, 0), 15 * 60);

  return new Date(Date.now() + delayInSeconds * 1000);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown dispatch assignment error";
  }
}

async function claimDispatchAssignmentJobs(
  limit: number,
): Promise<DispatchAssignmentJobRow[]> {
  return prisma.$transaction(async (tx) => {
    return tx.$queryRaw<DispatchAssignmentJobRow[]>`
      WITH candidate_jobs AS (
        SELECT "id"
        FROM "DispatchAssignmentJob"
        WHERE "status" IN ('PENDING', 'FAILED')
          AND "availableAt" <= NOW()
        ORDER BY "createdAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "DispatchAssignmentJob" job
      SET
        "status" = 'PROCESSING',
        "attempts" = job."attempts" + 1,
        "processingStartedAt" = NOW()
      FROM candidate_jobs
      WHERE job."id" = candidate_jobs."id"
      RETURNING
        job."id",
        job."orderId",
        job."deliveryAddressId",
        job."attempts"
    `;
  });
}

async function markDispatchAssignmentJobCompleted(jobId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "DispatchAssignmentJob"
    SET
      "status" = 'COMPLETED',
      "completedAt" = NOW(),
      "lastError" = NULL
    WHERE "id" = ${jobId}
  `;
}

async function markDispatchAssignmentJobFailed(
  jobId: string,
  attempts: number,
  error: unknown,
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "DispatchAssignmentJob"
    SET
      "status" = 'FAILED',
      "availableAt" = ${getRetryDate(attempts)},
      "lastError" = ${toErrorMessage(error)}
    WHERE "id" = ${jobId}
  `;
}

export async function enqueueAssignDeliveryOrderToDispatch(
  data: AssignDeliveryOrderToDispatchJob,
): Promise<void> {
  const job = normalizeJob(data);

  await prisma.$executeRaw`
    INSERT INTO "DispatchAssignmentJob" (
      "id",
      "orderId",
      "deliveryAddressId"
    )
    VALUES (
      ${randomUUID()},
      ${job.orderId},
      ${job.deliveryAddressId}
    )
    ON CONFLICT ("orderId")
    DO UPDATE SET
      "deliveryAddressId" = EXCLUDED."deliveryAddressId",
      "status" = 'PENDING',
      "availableAt" = NOW(),
      "lastError" = NULL,
      "completedAt" = NULL,
      "processingStartedAt" = NULL
  `;
}

export async function processDispatchAssignmentJobs(
  limit = MAX_JOBS_PER_RUN,
): Promise<{
  failed: number;
  processed: number;
}> {
  const jobs = await claimDispatchAssignmentJobs(limit);

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await assignDeliveryOrderToDispatchUseCase(prismaDispatchRepository, {
        orderId: job.orderId,
        deliveryAddressId: job.deliveryAddressId,
      });
      await markDispatchAssignmentJobCompleted(job.id);
      processed += 1;
    } catch (error: unknown) {
      await markDispatchAssignmentJobFailed(job.id, job.attempts, error);
      failed += 1;
    }
  }

  return {
    failed,
    processed,
  };
}
