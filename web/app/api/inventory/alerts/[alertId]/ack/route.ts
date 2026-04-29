import { NextRequest, NextResponse } from "next/server";
import { ackInventoryAlertUseCase } from "@/src/modules/inventory/application/ackInventoryAlert";
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

    const alert = await ackInventoryAlertUseCase(prismaInventoryRepository, {
      alertId,
      workerId: parseOptionalString(body.workerId, "workerId") ?? null,
    });

    return NextResponse.json(alert);
  } catch (error) {
    return inventoryErrorResponse(
      error,
      "PATCH /api/inventory/alerts/[alertId]/ack error:",
    );
  }
}
