import { NextRequest, NextResponse } from "next/server";
import { createInventoryPlaceUseCase } from "@/src/modules/inventory/application/createInventoryPlace";
import { listInventoryPlacesUseCase } from "@/src/modules/inventory/application/listInventoryPlaces";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import {
  inventoryErrorResponse,
  parseNullableString,
  parseOptionalBoolean,
  parseOptionalNullableInt,
  parseString,
} from "../_shared";

export async function GET() {
  try {
    const places = await listInventoryPlacesUseCase(prismaInventoryRepository);
    return NextResponse.json(places);
  } catch (error) {
    return inventoryErrorResponse(error, "GET /api/inventory/places error:");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      type?: unknown;
      active?: unknown;
      displayOrder?: unknown;
      notes?: unknown;
    };

    const place = await createInventoryPlaceUseCase(prismaInventoryRepository, {
      name: parseString(body.name, "name"),
      type: parseString(body.type, "type") as
        | "FRIDGE"
        | "FREEZER"
        | "SHELF"
        | "PANTRY"
        | "OTHER",
      active: parseOptionalBoolean(body.active, "active"),
      displayOrder: parseOptionalNullableInt(body.displayOrder, "displayOrder"),
      notes: parseNullableString(body.notes, "notes"),
    });

    return NextResponse.json(place, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "POST /api/inventory/places error:");
  }
}
