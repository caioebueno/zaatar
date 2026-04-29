import { NextRequest, NextResponse } from "next/server";
import { createInventoryProductUseCase } from "@/src/modules/inventory/application/createInventoryProduct";
import { listInventoryProductsUseCase } from "@/src/modules/inventory/application/listInventoryProducts";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import {
  inventoryErrorResponse,
  parseNullableString,
  parseOptionalBoolean,
  parseOptionalNullableInt,
  parseRequiredInt,
  parseString,
} from "../_shared";

export async function GET() {
  try {
    const products = await listInventoryProductsUseCase(prismaInventoryRepository);
    return NextResponse.json(products);
  } catch (error) {
    return inventoryErrorResponse(error, "GET /api/inventory/products error:");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      unit?: unknown;
      active?: unknown;
      minQuantity?: unknown;
      alertThreshold?: unknown;
      requiresRefill?: unknown;
      notifyBelowThreshold?: unknown;
      notes?: unknown;
    };

    const product = await createInventoryProductUseCase(prismaInventoryRepository, {
      name: parseString(body.name, "name"),
      unit: parseString(body.unit, "unit"),
      active: parseOptionalBoolean(body.active, "active"),
      minQuantity: parseRequiredInt(body.minQuantity, "minQuantity"),
      alertThreshold: parseOptionalNullableInt(body.alertThreshold, "alertThreshold"),
      requiresRefill: parseOptionalBoolean(body.requiresRefill, "requiresRefill"),
      notifyBelowThreshold: parseOptionalBoolean(
        body.notifyBelowThreshold,
        "notifyBelowThreshold",
      ),
      notes: parseNullableString(body.notes, "notes"),
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return inventoryErrorResponse(error, "POST /api/inventory/products error:");
  }
}
