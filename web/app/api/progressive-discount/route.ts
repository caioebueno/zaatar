import getProgressiveDiscount from "@/src/getProgressiveDiscount";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const progressiveDiscount = await getProgressiveDiscount();

    return NextResponse.json(progressiveDiscount);
  } catch (error) {
    console.error("GET /api/progressive-discount error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
