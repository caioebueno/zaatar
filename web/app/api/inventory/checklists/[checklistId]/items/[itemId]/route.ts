import { NextRequest, NextResponse } from "next/server";
import { updateInventoryChecklistItemUseCase } from "@/src/modules/inventory/application/updateInventoryChecklistItem";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import {
  inventoryErrorResponse,
  parseNullableString,
  parseOptionalString,
  parseRequiredInt,
} from "../../../../_shared";

type RouteContext = {
  params: Promise<{
    checklistId: string;
    itemId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { checklistId, itemId } = await context.params;

    const body = (await request.json()) as {
      countedQuantity?: unknown;
      notes?: unknown;
      result?: unknown;
      workerId?: unknown;
    };

    const checklist = await updateInventoryChecklistItemUseCase(
      prismaInventoryRepository,
      {
        checklistId,
        itemId,
        countedQuantity: parseRequiredInt(body.countedQuantity, "countedQuantity"),
        notes: parseNullableString(body.notes, "notes") ?? null,
        result: (parseOptionalString(body.result, "result") as
          | "PENDING"
          | "OK"
          | "BELOW_MIN"
          | "REFILL_NEEDED"
          | "OUT_OF_STOCK"
          | undefined) ?? null,
        workerId: parseOptionalString(body.workerId, "workerId") ?? null,
      },
    );

    return NextResponse.json(checklist);
  } catch (error) {
    return inventoryErrorResponse(
      error,
      "PATCH /api/inventory/checklists/[checklistId]/items/[itemId] error:",
    );
  }
}
