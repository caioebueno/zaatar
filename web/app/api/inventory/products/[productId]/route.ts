import { NextRequest, NextResponse } from "next/server";
import { updateInventoryProductUseCase } from "@/src/modules/inventory/application/updateInventoryProduct";
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
    productId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;

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

    const minQuantity = parseOptionalNullableInt(body.minQuantity, "minQuantity");

    const product = await updateInventoryProductUseCase(prismaInventoryRepository, {
      productId,
      name: parseOptionalString(body.name, "name"),
      unit: parseOptionalString(body.unit, "unit"),
      active: parseOptionalBoolean(body.active, "active"),
      minQuantity: minQuantity === null ? undefined : minQuantity,
      alertThreshold: parseOptionalNullableInt(body.alertThreshold, "alertThreshold"),
      requiresRefill: parseOptionalBoolean(body.requiresRefill, "requiresRefill"),
      notifyBelowThreshold: parseOptionalBoolean(
        body.notifyBelowThreshold,
        "notifyBelowThreshold",
      ),
      notes: parseNullableString(body.notes, "notes"),
    });

    return NextResponse.json(product);
  } catch (error) {
    return inventoryErrorResponse(
      error,
      "PATCH /api/inventory/products/[productId] error:",
    );
  }
}
