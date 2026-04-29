import { NextRequest, NextResponse } from "next/server";
import { updateInventoryStockChecklistPromptUseCase } from "@/src/modules/inventory/application/updateInventoryStockChecklistPrompt";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import {
  inventoryErrorResponse,
  parseOptionalBoolean,
  parseOptionalString,
  parseString,
} from "../../_shared";

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      placeId?: unknown;
      productId?: unknown;
      includeInChecklist?: unknown;
      actorId?: unknown;
    };

    const includeInChecklist = parseOptionalBoolean(
      body.includeInChecklist,
      "includeInChecklist",
    );

    if (includeInChecklist === undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "includeInChecklist" },
        { status: 400 },
      );
    }

    const stock = await updateInventoryStockChecklistPromptUseCase(
      prismaInventoryRepository,
      {
        placeId: parseString(body.placeId, "placeId"),
        productId: parseString(body.productId, "productId"),
        includeInChecklist,
        actorId: parseOptionalString(body.actorId, "actorId") ?? null,
      },
    );

    return NextResponse.json(stock);
  } catch (error) {
    return inventoryErrorResponse(
      error,
      "PATCH /api/inventory/stocks/prompt error:",
    );
  }
}
