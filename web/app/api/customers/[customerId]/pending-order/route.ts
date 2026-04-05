import getPendingOrderByCustomerId from "@/src/getPendingOrderByCustomerId";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      customerId: string;
    }>;
  },
) {
  try {
    const { customerId } = await params;
    const order = await getPendingOrderByCustomerId(customerId);

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pending order" },
      { status: 500 },
    );
  }
}
