import { NextRequest, NextResponse } from "next/server";
import { updateInventoryPlaceUseCase } from "@/src/modules/inventory/application/updateInventoryPlace";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import {
  inventoryErrorResponse,
  parseNullableString,
  parseOptionalBoolean,
  parseOptionalNullableInt,
  parseOptionalString,
} from "../../_shared";

type RouteContext = {
  params: Promise<{
    placeId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { placeId } = await context.params;

    const body = (await request.json()) as {
      name?: unknown;
      type?: unknown;
      active?: unknown;
      displayOrder?: unknown;
      notes?: unknown;
    };

    const place = await updateInventoryPlaceUseCase(prismaInventoryRepository, {
      placeId,
      name: parseOptionalString(body.name, "name"),
      type: parseOptionalString(body.type, "type") as
        | "FRIDGE"
        | "FREEZER"
        | "SHELF"
        | "PANTRY"
        | "OTHER"
        | undefined,
      active: parseOptionalBoolean(body.active, "active"),
      displayOrder: parseOptionalNullableInt(body.displayOrder, "displayOrder"),
      notes: parseNullableString(body.notes, "notes"),
    });

    return NextResponse.json(place);
  } catch (error) {
    return inventoryErrorResponse(error, "PATCH /api/inventory/places/[placeId] error:");
  }
}
