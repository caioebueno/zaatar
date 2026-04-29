import { NextRequest, NextResponse } from "next/server";
import { listInventoryAlertsUseCase } from "@/src/modules/inventory/application/listInventoryAlerts";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import { inventoryErrorResponse } from "../_shared";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const placeId = request.nextUrl.searchParams.get("placeId");
    const productId = request.nextUrl.searchParams.get("productId");

    const alerts = await listInventoryAlertsUseCase(prismaInventoryRepository, {
      status: (status as "OPEN" | "ACKED" | "RESOLVED" | null) ?? null,
      placeId,
      productId,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    return inventoryErrorResponse(error, "GET /api/inventory/alerts error:");
  }
}
