import getBranchWorkingHours from "@/src/getBranchWorkingHours";
import updateBranchWorkingHours from "@/src/updateBranchWorkingHours";
import {
  isOperationHours,
  normalizeOperationHours,
} from "@/src/modules/branch/domain/branch.types";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    branchId: string;
  }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const workingHours = await getBranchWorkingHours(branchId);

    return NextResponse.json(workingHours);
  } catch (error) {
    console.error("GET /api/branches/[branchId]/working-hours error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { branchId } = await context.params;
    const body = (await request.json()) as { operationHours?: unknown };

    if (!body || !isOperationHours(body.operationHours)) {
      return NextResponse.json(
        { error: "Invalid operationHours payload" },
        { status: 400 },
      );
    }

    const workingHours = await updateBranchWorkingHours({
      branchId,
      operationHours: normalizeOperationHours(body.operationHours),
    });

    return NextResponse.json(workingHours);
  } catch (error) {
    console.error("PUT /api/branches/[branchId]/working-hours error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
