import { NextRequest, NextResponse } from "next/server";
import { deleteInventoryStockUseCase } from "@/src/modules/inventory/application/deleteInventoryStock";
import { listInventoryStocksUseCase } from "@/src/modules/inventory/application/listInventoryStocks";
import { upsertInventoryStockUseCase } from "@/src/modules/inventory/application/upsertInventoryStock";
import { prismaInventoryRepository } from "@/src/modules/inventory/infrastructure/prisma/prismaInventoryRepository";
import {
  inventoryErrorResponse,
  parseOptionalBoolean,
  parseOptionalNullableInt,
  parseOptionalString,
  parseRequiredInt,
  parseString,
} from "../_shared";

export async function GET(request: NextRequest) {
  try {
    const placeId = request.nextUrl.searchParams.get("placeId");

    const stocks = await listInventoryStocksUseCase(prismaInventoryRepository, {
      placeId: placeId || null,
    });

    return NextResponse.json(stocks);
  } catch (error) {
    return inventoryErrorResponse(error, "GET /api/inventory/stocks error:");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      placeId?: unknown;
      productId?: unknown;
      currentQuantity?: unknown;
      minQuantity?: unknown;
      includeInChecklist?: unknown;
      actorId?: unknown;
      source?: unknown;
    };

    const minQuantity = parseOptionalNullableInt(body.minQuantity, "minQuantity");

    const stock = await upsertInventoryStockUseCase(prismaInventoryRepository, {
      placeId: parseString(body.placeId, "placeId"),
      productId: parseString(body.productId, "productId"),
      currentQuantity: parseRequiredInt(body.currentQuantity, "currentQuantity"),
      minQuantity: minQuantity === null ? undefined : minQuantity,
      includeInChecklist: parseOptionalBoolean(
        body.includeInChecklist,
        "includeInChecklist",
      ),
      actorId: parseOptionalString(body.actorId, "actorId") ?? null,
      source:
        (parseOptionalString(body.source, "source") as
          | "MANUAL"
          | "CHECKLIST"
          | "SYSTEM"
          | undefined) ??
        "MANUAL",
    });

    return NextResponse.json(stock);
  } catch (error) {
    return inventoryErrorResponse(error, "POST /api/inventory/stocks error:");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      placeId?: unknown;
      productId?: unknown;
      actorId?: unknown;
      source?: unknown;
    };

    const deleted = await deleteInventoryStockUseCase(prismaInventoryRepository, {
      placeId: parseString(body.placeId, "placeId"),
      productId: parseString(body.productId, "productId"),
      actorId: parseOptionalString(body.actorId, "actorId") ?? null,
      source:
        (parseOptionalString(body.source, "source") as
          | "MANUAL"
          | "SYSTEM"
          | undefined) ?? "MANUAL",
    });

    return NextResponse.json(deleted);
  } catch (error) {
    return inventoryErrorResponse(error, "DELETE /api/inventory/stocks error:");
  }
}
