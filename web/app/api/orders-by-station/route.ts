import getOrdersByStation from "@/src/getOrdersByStation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const stationId = request.nextUrl.searchParams.get("stationId");

    if (!stationId) {
      return NextResponse.json({ error: "Missing stationId" }, { status: 400 });
    }

    const orders = await getOrdersByStation(stationId);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders/station error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
