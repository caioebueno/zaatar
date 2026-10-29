import getProgressiveDiscount from "@/src/getProgressiveDiscount";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/progressive-discount?menuId= — that menu's ladder (default menu when omitted). */
export async function GET(request: NextRequest) {
  try {
    const menuId = request.nextUrl.searchParams.get("menuId")?.trim() || null;
    const progressiveDiscount = await getProgressiveDiscount(menuId);

    return NextResponse.json(progressiveDiscount);
  } catch (error) {
    console.error("GET /api/progressive-discount error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
