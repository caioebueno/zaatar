import prisma from "@/prisma";
import {
  buildPhoneCandidates,
  getDefaultCountryCode,
  normalizePhoneWithCountryCode,
} from "@/src/phone";
import {
  enqueueAssignDeliveryOrderToDispatch,
  processDispatchAssignmentJobs,
} from "@/src/modules/dispatch/application/assignDeliveryOrderToDispatchQueue";
import type { TOrderType, TPaymentMethod } from "@/src/types/order";
import { Prisma } from "@/src/generated/prisma";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

type ExternalClient = {
  id?: unknown;
  country_calling_code?: unknown;
  email?: unknown;
  name?: unknown;
  phone_number?: unknown;
};

type ExternalPayment = {
  method?: unknown;
  type?: unknown;
};

type ExternalOrder = {
  id?: unknown;
  public_id?: unknown;
  service_type?: unknown;
  payment_method?: unknown;
  payments?: unknown;
  created_at?: unknown;
  scheduled_delivery_date?: unknown;
  total?: unknown;
  total_usd?: unknown;
  client?: ExternalClient | null;
};

type ImportPayload =
  | {
      data?: ExternalOrder[];
    }
  | ExternalOrder[];

function isAuthorized(request: NextRequest): boolean {
  const secret =
    process.env.EXTERNAL_ORDER_IMPORT_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  if (!secret) {
    return true;
  }

  const authorizationHeader = request.headers.get("authorization");

  return authorizationHeader === `Bearer ${secret}`;
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function parseIsoDate(value: unknown): Date | undefined {
  const normalized = normalizeNonEmptyString(value);
  if (!normalized) return undefined;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed;
}

function toCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value * 100));
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed * 100));
    }
  }

  return 0;
}

function mapServiceTypeToOrderType(serviceType: unknown): TOrderType {
  const normalized = normalizeNonEmptyString(serviceType)?.toUpperCase();
  if (normalized === "DELIVERY") return "DELIVERY";
  return "TAKEAWAY";
}

function mapPaymentMethod(order: ExternalOrder): TPaymentMethod {
  const payments = Array.isArray(order.payments)
    ? (order.payments as ExternalPayment[])
    : [];
  const candidates: unknown[] = [
    order.payment_method,
    payments[0]?.method,
    payments[0]?.type,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeNonEmptyString(candidate)?.toUpperCase();
    if (!normalized) continue;
    if (normalized.includes("ZELLE")) return "ZELLE";
    if (normalized.includes("CARD")) return "CARD";
    if (normalized.includes("CASH")) return "CASH";
  }

  return "CASH";
}

function resolveExternalId(order: ExternalOrder): string | undefined {
  return (
    normalizeNonEmptyString(order.public_id) || normalizeNonEmptyString(order.id)
  );
}

function parseOrdersFromPayload(payload: ImportPayload): ExternalOrder[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: ExternalOrder[] }).data;
  }

  return [];
}

function getErrorReason(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const reason =
      "reason" in error && typeof (error as { reason?: unknown }).reason === "string"
        ? (error as { reason: string }).reason
        : undefined;

    if (reason) {
      return reason;
    }

    const code =
      "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;

    if (code) {
      return code;
    }
  }

  return "UNKNOWN_ERROR";
}

async function resolveCustomerIdTx(
  tx: Prisma.TransactionClient,
  client: ExternalClient | null | undefined,
): Promise<string | undefined> {
  if (!client) return undefined;

  const countryCode =
    normalizeNonEmptyString(client.country_calling_code)?.replace(/\D/g, "") ||
    getDefaultCountryCode();
  const normalizedPhone = normalizePhoneWithCountryCode(
    normalizeNonEmptyString(client.phone_number) || "",
    countryCode,
  );
  const normalizedName = normalizeNonEmptyString(client.name);

  if (!normalizedPhone) {
    return undefined;
  }

  const phoneCandidates = buildPhoneCandidates(normalizedPhone, countryCode);
  const existingCustomer = await tx.customer.findFirst({
    where: {
      phone: {
        in: phoneCandidates,
      },
    },
    select: {
      id: true,
      phone: true,
      name: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingCustomer) {
    const updateData: {
      phone?: string;
      name?: string | null;
    } = {};

    if (existingCustomer.phone !== normalizedPhone) {
      updateData.phone = normalizedPhone;
    }

    if (normalizedName && existingCustomer.name !== normalizedName) {
      updateData.name = normalizedName;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.customer.update({
        where: { id: existingCustomer.id },
        data: updateData,
      });
    }

    return existingCustomer.id;
  }

  const createdCustomer = await tx.customer.create({
    data: {
      id: randomUUID(),
      phone: normalizedPhone,
      ...(normalizedName ? { name: normalizedName } : {}),
    },
    select: {
      id: true,
    },
  });

  return createdCustomer.id;
}

async function createTakeawayDispatchTx(
  tx: Prisma.TransactionClient,
): Promise<{ dispatchId: string; dispatchOrderIndex: number }> {
  const dispatchId = randomUUID();

  await tx.dispatch.create({
    data: {
      id: dispatchId,
      dispatched: false,
      dispatchAt: null,
      driverId: null,
    },
  });

  return {
    dispatchId,
    dispatchOrderIndex: 1,
  };
}

async function triggerDispatchQueueRun(): Promise<void> {
  const workerBaseUrl = process.env.DISPATCH_QUEUE_WORKER_BASE_URL?.trim();

  if (!workerBaseUrl) {
    await processDispatchAssignmentJobs(1);
    return;
  }

  const endpoint = `${workerBaseUrl.replace(/\/$/, "")}/run`;
  const runSecret = process.env.DISPATCH_QUEUE_RUN_SECRET?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (runSecret) {
    headers.Authorization = `Bearer ${runSecret}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `QUEUE_WORKER_TRIGGER_FAILED status=${response.status} body=${errorBody}`,
    );
  }
}

async function resolveDeliveryAddressIdTx(
  tx: Prisma.TransactionClient,
  order: ExternalOrder,
): Promise<string | undefined> {
  const rawAddressId = normalizeNonEmptyString((order as { address_id?: unknown }).address_id);
  if (!rawAddressId) return undefined;

  const localAddress = await tx.deliveryAddress.findUnique({
    where: {
      id: rawAddressId,
    },
    select: {
      id: true,
    },
  });

  return localAddress?.id;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as ImportPayload;
    const externalOrders = parseOrdersFromPayload(payload);

    if (externalOrders.length === 0) {
      return NextResponse.json({
        received: 0,
        created: 0,
        skippedExisting: 0,
        skippedInvalid: 0,
      });
    }

    const createdOrderIds: string[] = [];
    const skippedExistingExternalIds: string[] = [];
    const skippedInvalidEntries: Array<{
      index: number;
      reason: string;
    }> = [];
    const deliveryDispatchJobs: Array<{ orderId: string; deliveryAddressId: string }> =
      [];
    const queueJobErrors: Array<{ orderId: string; reason: string }> = [];
    let enqueuedDeliveryDispatchJobs = 0;

    for (const [index, externalOrder] of externalOrders.entries()) {
      const externalId = resolveExternalId(externalOrder);

      if (!externalId) {
        skippedInvalidEntries.push({
          index,
          reason: "MISSING_EXTERNAL_ID",
        });
        continue;
      }

      try {
        const result = await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`
            SELECT pg_advisory_xact_lock(hashtext(${`external-order:${externalId}`})::bigint)
          `;

          const existingOrder = await tx.order.findFirst({
            where: {
              externalId,
            },
            select: {
              id: true,
            },
          });

          if (existingOrder) {
            return {
              created: false as const,
              orderId: existingOrder.id,
            };
          }

          const orderType = mapServiceTypeToOrderType(externalOrder.service_type);
          const paymentMethod = mapPaymentMethod(externalOrder);
          const customerId = await resolveCustomerIdTx(tx, externalOrder.client);
          const createdAt = parseIsoDate(externalOrder.created_at) || new Date();
          const scheduleFor = parseIsoDate(externalOrder.scheduled_delivery_date);
          const amountInCents = toCents(
            externalOrder.total_usd ?? externalOrder.total,
          );
          const orderNumber = normalizeNonEmptyString(externalOrder.public_id);
          const deliveryAddressId =
            orderType === "DELIVERY"
              ? await resolveDeliveryAddressIdTx(tx, externalOrder)
              : undefined;

          if (orderType === "DELIVERY" && !deliveryAddressId) {
            throw {
              code: "INVALID_PARAMS",
              details: { field: "address_id" },
              reason: "DELIVERY_MUST_HAVE_LOCAL_ADDRESS",
            };
          }

          const takeawayDispatch =
            orderType === "TAKEAWAY" ? await createTakeawayDispatchTx(tx) : null;

          const orderCreateData = {
            id: randomUUID(),
            amount: amountInCents,
            externalId,
            createdAt,
            scheduleFor: scheduleFor ?? null,
            paymentMethod,
            type: orderType,
            ...(orderNumber ? { number: orderNumber } : {}),
            ...(customerId ? { customerId } : {}),
            ...(deliveryAddressId ? { deliveryAddressId } : {}),
            ...(takeawayDispatch
              ? {
                  dispatchId: takeawayDispatch.dispatchId,
                  dispatchOrderIndex: takeawayDispatch.dispatchOrderIndex,
                }
              : {}),
          };

          const createdOrder = await tx.order.create({
            data: orderCreateData as Prisma.OrderUncheckedCreateInput,
            select: {
              id: true,
            },
          });

          return {
            created: true as const,
            orderId: createdOrder.id,
            deliveryAddressId,
          };
        });

        if (result.created) {
          createdOrderIds.push(result.orderId);
          if (result.deliveryAddressId) {
            deliveryDispatchJobs.push({
              orderId: result.orderId,
              deliveryAddressId: result.deliveryAddressId,
            });
          }
        } else {
          skippedExistingExternalIds.push(externalId);
        }
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          skippedExistingExternalIds.push(externalId);
          continue;
        }

        const reason = getErrorReason(error);
        skippedInvalidEntries.push({
          index,
          reason,
        });

        console.error(
          `POST /api/internal/external-orders/import order failed at index=${index} externalId=${externalId}:`,
          error,
        );
      }
    }

    let queueRunError: string | null = null;

    if (deliveryDispatchJobs.length > 0) {
      for (const job of deliveryDispatchJobs) {
        try {
          await enqueueAssignDeliveryOrderToDispatch(job);
          enqueuedDeliveryDispatchJobs += 1;
        } catch (error) {
          const reason = getErrorReason(error);
          queueJobErrors.push({
            orderId: job.orderId,
            reason,
          });
          console.error(
            `POST /api/internal/external-orders/import failed to enqueue dispatch assignment job for orderId=${job.orderId}:`,
            error,
          );
        }
      }

      if (enqueuedDeliveryDispatchJobs > 0) {
        try {
          await triggerDispatchQueueRun();
        } catch (error) {
          queueRunError = getErrorReason(error);
          console.error(
            "POST /api/internal/external-orders/import failed to trigger dispatch queue run:",
            error,
          );
        }
      }
    }

    return NextResponse.json({
      received: externalOrders.length,
      created: createdOrderIds.length,
      skippedExisting: skippedExistingExternalIds.length,
      skippedInvalid: skippedInvalidEntries.length,
      createdOrderIds,
      enqueuedDeliveryDispatchJobs,
      queueRunTriggered:
        enqueuedDeliveryDispatchJobs > 0 && queueRunError === null,
      ...(queueRunError ? { queueRunError } : {}),
      queueJobErrors,
      skippedExistingExternalIds,
      skippedInvalidEntries,
    });
  } catch (error) {
    const reason = getErrorReason(error);
    console.error("POST /api/internal/external-orders/import error:", error);

    return NextResponse.json(
      { error: "Internal Server Error", reason },
      { status: 500 },
    );
  }
}
