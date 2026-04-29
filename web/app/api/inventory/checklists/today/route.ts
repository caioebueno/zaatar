import { NextRequest, NextResponse } from "next/server";
import { getTodayInventoryChecklistUseCase } from "@/src/modules/inventory/application/getTodayInventoryChecklist";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import { inventoryErrorResponse } from "../../_shared";

function getFloridaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") || getFloridaDate();
    const checklist = await getTodayInventoryChecklistUseCase(
      prismaInventoryRepository,
      date,
    );

    return NextResponse.json(checklist);
  } catch (error) {
    return inventoryErrorResponse(error, "GET /api/inventory/checklists/today error:");
  }
}
