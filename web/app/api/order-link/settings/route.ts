import { getOrderLinkSettings } from "@/src/getOrderLinkSettings";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const settings = await getOrderLinkSettings();
    const response = NextResponse.json(settings);

    response.headers.set(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300",
    );

    return response;
  } catch (error) {
    console.error("GET /api/order-link/settings error:", error);
    return NextResponse.json(
      { error: "Could not load order link settings" },
      { status: 500 },
    );
  }
}

