import getDrivers from "@/src/getDrivers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const drivers = await getDrivers();

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("GET /api/drivers error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
