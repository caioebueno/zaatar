import prisma from "@/prisma";
import {
  buildPhoneCandidates,
  getDefaultCountryCode,
  normalizePhoneDigits,
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
  address?: unknown;
  address_id?: unknown;
  payment_method?: unknown;
  payments?: unknown;
  created_at?: unknown;
  scheduled_delivery_date?: unknown;
  total?: unknown;
  total_usd?: unknown;
  total_tips?: unknown;
  client?: ExternalClient | null;
};

type ImportPayload =
  | {
      data?: ExternalOrder[];
    }
  | ExternalOrder[];

type ExternalAddressData = {
  address?: string;
  lat?: string;
  lng?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
};

const DEFAULT_IMPORT_ADDRESS_LAT =
  process.env.DEFAULT_IMPORT_ADDRESS_LAT?.trim() || "28.34883080351401";
const DEFAULT_IMPORT_ADDRESS_LNG =
  process.env.DEFAULT_IMPORT_ADDRESS_LNG?.trim() || "-81.65145586075074";

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

function mapServiceTypeToOrderType(order: ExternalOrder): TOrderType {
  const normalizedServiceType = normalizeNonEmptyString(
    order.service_type,
  )?.toUpperCase();

  if (normalizedServiceType) {
    if (normalizedServiceType.includes("DELIVER")) {
      return "DELIVERY";
    }

    if (
      normalizedServiceType.includes("TAKEAWAY") ||
      normalizedServiceType.includes("ONSITE") ||
      normalizedServiceType.includes("PICKUP")
    ) {
      return "TAKEAWAY";
    }
  }

  // Fallback for providers that send non-standard service type values.
  // If there is delivery address data, treat the order as DELIVERY.
  const hasAddressId = Boolean(normalizeNonEmptyString(order.address_id));
  const hasAddressValue =
    typeof order.address === "string"
      ? Boolean(normalizeNonEmptyString(order.address))
      : Boolean(order.address && typeof order.address === "object");

  if (hasAddressId || hasAddressValue) {
    return "DELIVERY";
  }

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

function normalizeCoordinate(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return undefined;
    return String(parsed);
  }

  return undefined;
}

function extractExternalAddressData(order: ExternalOrder): ExternalAddressData {
  const rawAddress = order.address;

  if (typeof rawAddress === "string") {
    return {
      address: normalizeNonEmptyString(rawAddress),
    };
  }

  if (!rawAddress || typeof rawAddress !== "object" || Array.isArray(rawAddress)) {
    return {};
  }

  const addressRecord = rawAddress as Record<string, unknown>;

  const address =
    normalizeNonEmptyString(addressRecord.address) ||
    normalizeNonEmptyString(addressRecord.formatted_address) ||
    normalizeNonEmptyString(addressRecord.full_address) ||
    normalizeNonEmptyString(addressRecord.description) ||
    normalizeNonEmptyString(addressRecord.street) ||
    normalizeNonEmptyString(addressRecord.line_1);

  const lat =
    normalizeCoordinate(addressRecord.lat) ||
    normalizeCoordinate(addressRecord.latitude) ||
    normalizeCoordinate(
      (addressRecord.location as Record<string, unknown> | undefined)?.lat,
    ) ||
    normalizeCoordinate(
      (addressRecord.location as Record<string, unknown> | undefined)?.latitude,
    );

  const lng =
    normalizeCoordinate(addressRecord.lng) ||
    normalizeCoordinate(addressRecord.longitude) ||
    normalizeCoordinate(
      (addressRecord.location as Record<string, unknown> | undefined)?.lng,
    ) ||
    normalizeCoordinate(
      (addressRecord.location as Record<string, unknown> | undefined)?.longitude,
    );

  const city =
    normalizeNonEmptyString(addressRecord.city) ||
    normalizeNonEmptyString(addressRecord.locality);
  const state =
    normalizeNonEmptyString(addressRecord.state) ||
    normalizeNonEmptyString(addressRecord.region);
  const zipCode =
    normalizeNonEmptyString(addressRecord.zipCode) ||
    normalizeNonEmptyString(addressRecord.zip_code) ||
    normalizeNonEmptyString(addressRecord.postal_code);
  const street =
    normalizeNonEmptyString(addressRecord.street) ||
    normalizeNonEmptyString(addressRecord.line_1) ||
    normalizeNonEmptyString(addressRecord.road);
  const number =
    normalizeNonEmptyString(addressRecord.number) ||
    normalizeNonEmptyString(addressRecord.street_number);
  const complement =
    normalizeNonEmptyString(addressRecord.complement) ||
    normalizeNonEmptyString(addressRecord.line_2);

  return {
    ...(address ? { address } : {}),
    ...(lat ? { lat } : {}),
    ...(lng ? { lng } : {}),
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(zipCode ? { zipCode } : {}),
    ...(street ? { street } : {}),
    ...(number ? { number } : {}),
    ...(complement ? { complement } : {}),
  };
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
  const rawPhone = normalizeNonEmptyString(client.phone_number) || "";
  const rawPhoneDigits = normalizePhoneDigits(rawPhone);

  if (!rawPhoneDigits) {
    return undefined;
  }

  const maybeNormalizedPhone = normalizePhoneWithCountryCode(
    normalizeNonEmptyString(client.phone_number) || "",
    countryCode,
  );
  const normalizedPhone =
    countryCode && !rawPhoneDigits.startsWith(countryCode)
      ? `${countryCode}${rawPhoneDigits}`
      : maybeNormalizedPhone || rawPhoneDigits;
  const normalizedName = normalizeNonEmptyString(client.name);

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

async function triggerDispatchQueueRun(jobsToPrioritize = 1): Promise<void> {
  const normalizedLimit = Number.isFinite(jobsToPrioritize)
    ? Math.max(1, Math.floor(jobsToPrioritize))
    : 1;
  const workerBaseUrl = process.env.DISPATCH_QUEUE_WORKER_BASE_URL?.trim();

  if (!workerBaseUrl) {
    await processDispatchAssignmentJobs(normalizedLimit);
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
    body: JSON.stringify({
      limit: normalizedLimit,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    // Worker trigger failed: fallback to local processing so imports can still
    // create dispatches immediately.
    await processDispatchAssignmentJobs(normalizedLimit);
    console.warn(
      `QUEUE_WORKER_TRIGGER_FAILED status=${response.status} body=${errorBody} (fell_back_to_local_queue_processing=true)`,
    );
    return;
  }
}

async function resolveDeliveryAddressIdTx(
  tx: Prisma.TransactionClient,
  order: ExternalOrder,
): Promise<string | undefined> {
  const rawAddressId = normalizeNonEmptyString(order.address_id);
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

async function createExternalAddressTx(
  tx: Prisma.TransactionClient,
  addressData: ExternalAddressData,
  customerId?: string,
): Promise<string> {
  const createdExternalAddress = await tx.externalAddress.create({
    data: {
      id: randomUUID(),
      ...(addressData.address ? { address: addressData.address } : {}),
      ...(addressData.lat ? { lat: addressData.lat } : {}),
      ...(addressData.lng ? { lng: addressData.lng } : {}),
      ...(customerId ? { customerId } : {}),
    },
    select: {
      id: true,
    },
  });

  return createdExternalAddress.id;
}

async function createDeliveryAddressTx(
  tx: Prisma.TransactionClient,
  addressData: ExternalAddressData,
  customerId?: string,
): Promise<string> {
  const lat = addressData.lat ?? DEFAULT_IMPORT_ADDRESS_LAT;
  const lng = addressData.lng ?? DEFAULT_IMPORT_ADDRESS_LNG;
  const description = addressData.address ?? "External Delivery Address";
  const street = addressData.street ?? addressData.address ?? "External Address";
  const number = addressData.number ?? "N/A";
  const city = addressData.city ?? "Unknown";
  const state = addressData.state ?? "Unknown";
  const zipCode = addressData.zipCode ?? "00000";

  const createdDeliveryAddress = await tx.deliveryAddress.create({
    data: {
      id: randomUUID(),
      lat,
      lng,
      description,
      street,
      number,
      city,
      State: state,
      zipCode,
      ...(addressData.complement ? { complement: addressData.complement } : {}),
      ...(customerId ? { customerId } : {}),
    },
    select: {
      id: true,
    },
  });

  return createdDeliveryAddress.id;
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

          const orderType = mapServiceTypeToOrderType(externalOrder);
          const paymentMethod = mapPaymentMethod(externalOrder);
          const customerId = await resolveCustomerIdTx(tx, externalOrder.client);
          const createdAt = parseIsoDate(externalOrder.created_at) || new Date();
          const scheduleFor = parseIsoDate(externalOrder.scheduled_delivery_date);
          const amountInCents = toCents(
            externalOrder.total_usd ?? externalOrder.total,
          );
          const tipAmountInCents = toCents(externalOrder.total_tips);
          const orderNumber = normalizeNonEmptyString(externalOrder.public_id);
          const addressData = extractExternalAddressData(externalOrder);
          const resolvedDeliveryAddressId =
            orderType === "DELIVERY"
              ? await resolveDeliveryAddressIdTx(tx, externalOrder)
              : undefined;
          const deliveryAddressId =
            orderType === "DELIVERY"
              ? resolvedDeliveryAddressId ||
                (await createDeliveryAddressTx(tx, addressData, customerId))
              : undefined;
          const externalAddressId =
            orderType === "DELIVERY"
              ? await createExternalAddressTx(tx, addressData, customerId)
              : undefined;

          const takeawayDispatch =
            orderType === "TAKEAWAY" ? await createTakeawayDispatchTx(tx) : null;

          const orderCreateData = {
            id: randomUUID(),
            amount: amountInCents,
            tipAmount: tipAmountInCents > 0 ? tipAmountInCents : null,
            externalId,
            createdAt,
            scheduleFor: scheduleFor ?? null,
            paymentMethod,
            type: orderType,
            ...(orderNumber ? { number: orderNumber } : {}),
            ...(customerId ? { customerId } : {}),
            ...(deliveryAddressId ? { deliveryAddressId } : {}),
            ...(externalAddressId ? { externalAddressId } : {}),
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
          await triggerDispatchQueueRun(enqueuedDeliveryDispatchJobs);
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
