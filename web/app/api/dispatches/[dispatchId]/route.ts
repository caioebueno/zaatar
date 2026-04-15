import updateDispatchStatus from "@/src/updateDispatchStatus";
import sendDispatchDispatchedDeliveryWhatsAppMessages from "@/src/sendDispatchDispatchedDeliveryWhatsAppMessages";
import prisma from "@/prisma";
import { after, NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    dispatchId: string;
  }>;
};

type PatchBody = {
  dispatched?: unknown;
  dispatchAt?: unknown;
  dispatchedAt?: unknown;
  driverId?: unknown;
  queueIndex?: unknown;
};

function parseDispatchAt(body: PatchBody): string | null | undefined {
  if (
    body.dispatchAt !== undefined &&
    body.dispatchedAt !== undefined &&
    body.dispatchAt !== body.dispatchedAt
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "dispatchAt",
      },
    };
  }

  const value =
    body.dispatchAt !== undefined ? body.dispatchAt : body.dispatchedAt;

  if (
    value !== undefined &&
    value !== null &&
    typeof value !== "string"
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "dispatchAt",
      },
    };
  }

  return value as string | null | undefined;
}

function parseDriverId(body: PatchBody): string | null | undefined {
  if (body.driverId === undefined) {
    return undefined;
  }

  if (body.driverId === null) {
    return null;
  }

  if (typeof body.driverId !== "string") {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "driverId",
      },
    };
  }

  return body.driverId;
}

function parseQueueIndex(body: PatchBody): number | undefined {
  if (body.queueIndex === undefined) {
    return undefined;
  }

  if (
    typeof body.queueIndex !== "number" ||
    !Number.isFinite(body.queueIndex) ||
    !Number.isInteger(body.queueIndex) ||
    body.queueIndex < 1
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "queueIndex",
      },
    };
  }

  return body.queueIndex;
}

function mapKnownError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: string }).code;
  const field =
    "details" in error &&
    typeof (error as { details?: { field?: string } }).details?.field === "string"
      ? (error as { details?: { field?: string } }).details?.field
      : undefined;
  const service =
    "details" in error &&
    typeof (error as { details?: { service?: string } }).details?.service ===
      "string"
      ? (error as { details?: { service?: string } }).details?.service
      : undefined;

  if (code === "INVALID_PARAMS") {
    return NextResponse.json(
      { error: "Invalid payload", ...(field ? { field } : {}) },
      { status: 400 },
    );
  }

  if (code === "NOT_FOUND") {
    if (service === "DRIVER") {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
  }

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { dispatchId } = await context.params;
    const body = (await request.json()) as PatchBody;
    const hasDispatched = body.dispatched !== undefined;
    const hasDriverId = body.driverId !== undefined;
    const hasQueueIndex = body.queueIndex !== undefined;
    const shouldNotifyDispatchedOrders =
      hasDispatched && body.dispatched === true;
    let wasDispatchedBeforeUpdate = false;

    if (!hasDispatched && !hasDriverId && !hasQueueIndex) {
      return NextResponse.json(
        { error: "Invalid payload", field: "body" },
        { status: 400 },
      );
    }

    if (hasDispatched && typeof body.dispatched !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload", field: "dispatched" },
        { status: 400 },
      );
    }

    const parsedDispatchAt = parseDispatchAt(body);

    if (parsedDispatchAt !== undefined && !hasDispatched) {
      return NextResponse.json(
        { error: "Invalid payload", field: "dispatched" },
        { status: 400 },
      );
    }

    if (shouldNotifyDispatchedOrders) {
      const existingDispatch = await prisma.dispatch.findUnique({
        where: {
          id: dispatchId,
        },
        select: {
          dispatched: true,
        },
      });

      wasDispatchedBeforeUpdate = existingDispatch?.dispatched ?? false;
    }

    const dispatch = await updateDispatchStatus({
      dispatchId,
      dispatched: hasDispatched ? (body.dispatched as boolean) : undefined,
      dispatchAt: parsedDispatchAt,
      driverId: parseDriverId(body),
      queueIndex: parseQueueIndex(body),
    });

    if (
      shouldNotifyDispatchedOrders &&
      !wasDispatchedBeforeUpdate &&
      dispatch.dispatched
    ) {
      after(async () => {
        await sendDispatchDispatchedDeliveryWhatsAppMessages(dispatch).catch(
          (error) => {
            console.error(
              "Failed to send dispatched delivery WhatsApp notifications:",
              error,
            );
          },
        );
      });
    }

    return NextResponse.json(dispatch);
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    console.error("PATCH /api/dispatches/[dispatchId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
