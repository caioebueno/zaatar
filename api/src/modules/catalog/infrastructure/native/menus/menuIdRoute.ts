import prisma from "../../../../../prisma.js";
import type { HttpResponse } from "../../../../../shared/http/types.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";
import { enqueueSquareMenuSyncTasks } from "../shared/squareCatalogSync.js";

type RouteContext = {
  params: Promise<{
    menuId: string;
  }>;
};

type PatchBody = {
  name?: unknown;
  active?: unknown;
  isDefault?: unknown;
  progressiveDiscountId?: unknown;
};

/** undefined = leave as is, null = detach, string = attach that ladder. */
function parseOptionalDiscountId(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(field);
  }

  return value.trim();
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error(field);
  }

  return normalizedValue;
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

export async function PATCH(request: NextRequestLike, context: RouteContext) {
  try {
    const { menuId } = await context.params;
    const normalizedMenuId = menuId.trim();
    const businessId = request.headers?.["x-business-id"]?.trim() || null;

    if (!normalizedMenuId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "menuId" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as PatchBody;
    const name = parseOptionalString(body.name, "name");
    const active = parseOptionalBoolean(body.active, "active");
    const isDefault = parseOptionalBoolean(body.isDefault, "isDefault");
    const progressiveDiscountId = parseOptionalDiscountId(body.progressiveDiscountId, "progressiveDiscountId");

    if (name === undefined && active === undefined && isDefault === undefined && progressiveDiscountId === undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "name|active|isDefault|progressiveDiscountId" },
        { status: 400 },
      );
    }

    if (progressiveDiscountId) {
      const discount = await prisma.progressiveDiscount.findUnique({
        where: { id: progressiveDiscountId },
        select: { id: true },
      });
      if (!discount) {
        return NextResponse.json(
          { error: "Invalid payload", field: "progressiveDiscountId" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.menu.updateMany({
          data: {
            isDefault: false,
          },
        });
      }

      return tx.menu.update({
        where: {
          id: normalizedMenuId,
        },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(active !== undefined ? { active } : {}),
          ...(isDefault !== undefined ? { isDefault } : {}),
          ...(progressiveDiscountId !== undefined ? { progressiveDiscountId } : {}),
        },
      });
    });

    // Square has no notion of progressive discounts: a discount-only change
    // leaves the catalog as it was.
    const touchesCatalog = name !== undefined || active !== undefined || isDefault !== undefined;
    if (touchesCatalog) await enqueueSquareMenuSyncTasks({
      businessId,
      menuIds: [normalizedMenuId],
      requestPayload: {
        source: "MENU_PATCH",
        menuId: normalizedMenuId,
        triggeredAt: new Date().toISOString(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    console.error("PATCH /api/menus/[menuId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
