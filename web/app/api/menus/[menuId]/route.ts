import prisma from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    menuId: string;
  }>;
};

type PatchBody = {
  name?: unknown;
  active?: unknown;
  isDefault?: unknown;
};

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { menuId } = await context.params;
    const normalizedMenuId = menuId.trim();

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

    if (name === undefined && active === undefined && isDefault === undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "name|active|isDefault" },
        { status: 400 },
      );
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
        },
      });
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
