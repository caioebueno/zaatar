import updateDispatchStatus from "@/src/updateDispatchStatus";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    dispatchId: string;
  }>;
};

type PatchBody = {
  dispatched?: unknown;
  dispatchAt?: unknown;
  dispatchedAt?: unknown;
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

  if (code === "INVALID_PARAMS") {
    return NextResponse.json(
      { error: "Invalid payload", ...(field ? { field } : {}) },
      { status: 400 },
    );
  }

  if (code === "NOT_FOUND") {
    return NextResponse.json({ error: "Dispatch not found" }, { status: 404 });
  }

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { dispatchId } = await context.params;
    const body = (await request.json()) as PatchBody;

    if (typeof body?.dispatched !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload", field: "dispatched" },
        { status: 400 },
      );
    }

    const dispatch = await updateDispatchStatus({
      dispatchId,
      dispatched: body.dispatched,
      dispatchAt: parseDispatchAt(body),
    });

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
