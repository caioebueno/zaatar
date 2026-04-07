import getNextDispatchForDriver from "@/src/getNextDispatchForDriver";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const driverId = request.nextUrl.searchParams.get("driverId");

  if (!driverId) {
    return NextResponse.json(
      { error: "Missing driverId" },
      { status: 400 },
    );
  }

  try {
    const dispatch = await getNextDispatchForDriver(driverId);

    return NextResponse.json(dispatch ?? null);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "INVALID_PARAMS"
    ) {
      return NextResponse.json(
        { error: "Invalid driverId" },
        { status: 400 },
      );
    }

    console.error("GET /api/dispatches/next error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
