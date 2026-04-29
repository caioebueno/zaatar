import { NextRequest, NextResponse } from "next/server";
import { resolveInventoryAlertUseCase } from "@/src/modules/inventory/application/resolveInventoryAlert";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import { inventoryErrorResponse, parseOptionalString } from "../../../_shared";

type RouteContext = {
  params: Promise<{
    alertId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { alertId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      workerId?: unknown;
    };

    const alert = await resolveInventoryAlertUseCase(prismaInventoryRepository, {
      alertId,
      workerId: parseOptionalString(body.workerId, "workerId") ?? null,
    });

    return NextResponse.json(alert);
  } catch (error) {
    return inventoryErrorResponse(
      error,
      "PATCH /api/inventory/alerts/[alertId]/resolve error:",
    );
  }
}
