import { NextRequest, NextResponse } from "next/server";
import { submitInventoryChecklistUseCase } from "@/src/modules/inventory/application/submitInventoryChecklist";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import { inventoryErrorResponse, parseOptionalString } from "../../../_shared";

type RouteContext = {
  params: Promise<{
    checklistId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { checklistId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      workerId?: unknown;
    };

    const checklist = await submitInventoryChecklistUseCase(
      prismaInventoryRepository,
      {
        checklistId,
        workerId: parseOptionalString(body.workerId, "workerId") ?? null,
      },
    );

    return NextResponse.json(checklist);
  } catch (error) {
    return inventoryErrorResponse(
      error,
      "POST /api/inventory/checklists/[checklistId]/submit error:",
    );
  }
}
