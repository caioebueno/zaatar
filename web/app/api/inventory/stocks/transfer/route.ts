import { NextRequest, NextResponse } from "next/server";
import { transferInventoryStockUseCase } from "@/src/modules/inventory/application/transferInventoryStock";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import {
  inventoryErrorResponse,
  parseNullableString,
  parseOptionalString,
  parseRequiredInt,
  parseString,
} from "../../_shared";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      fromPlaceId?: unknown;
      toPlaceId?: unknown;
      productId?: unknown;
      quantity?: unknown;
      actorId?: unknown;
      source?: unknown;
      checklistId?: unknown;
      checklistItemId?: unknown;
      notes?: unknown;
    };

    const result = await transferInventoryStockUseCase(prismaInventoryRepository, {
      fromPlaceId: parseString(body.fromPlaceId, "fromPlaceId"),
      toPlaceId: parseString(body.toPlaceId, "toPlaceId"),
      productId: parseString(body.productId, "productId"),
      quantity: parseRequiredInt(body.quantity, "quantity"),
      actorId: parseOptionalString(body.actorId, "actorId") ?? null,
      source:
        (parseOptionalString(body.source, "source") as
          | "MANUAL"
          | "CHECKLIST"
          | "SYSTEM"
          | undefined) ?? "CHECKLIST",
      checklistId: parseOptionalString(body.checklistId, "checklistId") ?? null,
      checklistItemId:
        parseOptionalString(body.checklistItemId, "checklistItemId") ?? null,
      notes: parseNullableString(body.notes, "notes") ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return inventoryErrorResponse(error, "POST /api/inventory/stocks/transfer error:");
  }
}
