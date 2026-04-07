import { processDispatchAssignmentJobs } from "@/src/modules/dispatch/application/assignDeliveryOrderToDispatchQueue";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  const authorizationHeader = request.headers.get("authorization");

  return authorizationHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDispatchAssignmentJobs();

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "GET /api/internal/dispatch-assignment-jobs/process error:",
      error,
    );

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
