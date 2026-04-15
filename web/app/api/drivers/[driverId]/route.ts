import updateDriverActive from "@/src/updateDriverActive";
import updateDriverPriority from "@/src/updateDriverPriority";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    driverId: string;
  }>;
};

type PatchBody = {
  active?: unknown;
  priorityLevel?: unknown;
};

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

  if (code === "NOT_FOUND" && service === "DRIVER") {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { driverId } = await context.params;
    const body = (await request.json()) as PatchBody;
    const hasActive = body.active !== undefined;
    const hasPriorityLevel = body.priorityLevel !== undefined;

    if (!hasActive && !hasPriorityLevel) {
      return NextResponse.json(
        { error: "Invalid payload", field: "body" },
        { status: 400 },
      );
    }

    if (hasActive && typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload", field: "active" },
        { status: 400 },
      );
    }

    if (hasPriorityLevel) {
      if (
        typeof body.priorityLevel !== "number" ||
        !Number.isInteger(body.priorityLevel) ||
        body.priorityLevel < 0
      ) {
        return NextResponse.json(
          { error: "Invalid payload", field: "priorityLevel" },
          { status: 400 },
        );
      }
    }

    let driver;

    if (hasPriorityLevel) {
      driver = await updateDriverPriority({
        driverId,
        priorityLevel: body.priorityLevel as number,
      });
    }

    if (hasActive) {
      driver = await updateDriverActive({
        driverId,
        active: body.active as boolean,
      });
    }

    return NextResponse.json(driver);
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    console.error("PATCH /api/drivers/[driverId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
