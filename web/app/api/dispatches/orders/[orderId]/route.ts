import { moveDispatchOrderUseCase } from "@/src/modules/dispatch/application/moveDispatchOrder";
import { prismaDispatchRepository } from "@/src/modules/dispatch/infrastructure/prisma/prismaDispatchRepository";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type PatchBody = {
  createNewDispatch?: unknown;
  targetDispatchId?: unknown;
  targetIndex?: unknown;
};

function parseBody(body: PatchBody) {
  if (
    body.createNewDispatch !== undefined &&
    typeof body.createNewDispatch !== "boolean"
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "createNewDispatch",
      },
    };
  }

  if (
    body.targetDispatchId !== undefined &&
    typeof body.targetDispatchId !== "string"
  ) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "targetDispatchId",
      },
    };
  }

  if (body.targetIndex !== undefined) {
    if (
      typeof body.targetIndex !== "number" ||
      !Number.isInteger(body.targetIndex) ||
      body.targetIndex < 1
    ) {
      throw {
        code: "INVALID_PARAMS",
        details: {
          field: "targetIndex",
        },
      };
    }
  }

  return {
    createNewDispatch: body.createNewDispatch as boolean | undefined,
    targetDispatchId: body.targetDispatchId as string | undefined,
    targetIndex: body.targetIndex as number | undefined,
  };
}

function mapKnownError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: string }).code;
  const field =
    "details" in error &&
    typeof (error as { details?: { field?: string } }).details?.field ===
      "string"
      ? (error as { details?: { field?: string } }).details?.field
      : undefined;
  const reason =
    "details" in error &&
    typeof (error as { details?: { message?: string } }).details?.message ===
      "string"
      ? (error as { details?: { message?: string } }).details?.message
      : undefined;
  const service =
    "details" in error &&
    typeof (error as { details?: { service?: string } }).details?.service ===
      "string"
      ? (error as { details?: { service?: string } }).details?.service
      : undefined;

  if (code === "INVALID_PARAMS") {
    return NextResponse.json(
      {
        error: "Invalid payload",
        ...(field ? { field } : {}),
        ...(reason ? { reason } : {}),
      },
      { status: 400 },
    );
  }

  if (code === "NOT_FOUND") {
    if (service === "ORDER") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (service === "DISPATCH") {
      return NextResponse.json(
        { error: "Target dispatch not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as PatchBody;
    const parsedBody = parseBody(body);

    const result = await moveDispatchOrderUseCase(prismaDispatchRepository, {
      orderId,
      createNewDispatch: parsedBody.createNewDispatch,
      targetDispatchId: parsedBody.targetDispatchId,
      targetIndex: parsedBody.targetIndex,
    });

    return NextResponse.json(result);
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    console.error("PATCH /api/dispatches/orders/[orderId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
