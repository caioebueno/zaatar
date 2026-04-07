import getDispatches from "@/src/getDispatches";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dispatches = await getDispatches();

    return NextResponse.json(dispatches);
  } catch (error) {
    console.error("GET /api/dispatches error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
