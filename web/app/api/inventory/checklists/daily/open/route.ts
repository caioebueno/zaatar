import { NextRequest, NextResponse } from "next/server";
import { openDailyInventoryChecklistUseCase } from "@/src/modules/inventory/application/openDailyInventoryChecklist";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import { inventoryErrorResponse, parseOptionalString } from "../../../_shared";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      workerId?: unknown;
      date?: unknown;
    };

    const checklist = await openDailyInventoryChecklistUseCase(
      prismaInventoryRepository,
      {
        workerId: parseOptionalString(body.workerId, "workerId") ?? null,
        date: parseOptionalString(body.date, "date") ?? null,
      },
    );

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(
      error,
      "POST /api/inventory/checklists/daily/open error:",
    );
  }
}
