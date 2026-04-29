import { NextRequest, NextResponse } from "next/server";
import { getInventoryDashboardUseCase } from "@/src/modules/inventory/application/getInventoryDashboard";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import { inventoryErrorResponse } from "../_shared";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date");
    const dashboard = await getInventoryDashboardUseCase(
      prismaInventoryRepository,
      date,
    );

    return NextResponse.json(dashboard);
  } catch (error) {
    return inventoryErrorResponse(error, "GET /api/inventory/dashboard error:");
  }
}
