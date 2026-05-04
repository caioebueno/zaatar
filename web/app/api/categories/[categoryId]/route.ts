import prisma from "@/prisma";
import { DEFAULT_MENU_ID } from "@/src/constants/menu";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    categoryId: string;
  }>;
};

type PatchBody = {
  menuIndex?: unknown;
  menuId?: unknown;
};

function parseMenuIndex(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("menuIndex");
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("menuIndex");
  }

  return value;
}

function parseMenuId(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("menuId");
  }

  return value.trim();
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { categoryId } = await context.params;
    const normalizedCategoryId = categoryId.trim();

    if (!normalizedCategoryId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "categoryId" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as PatchBody;

    if (body.menuIndex === undefined && body.menuId === undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "menuIndex|menuId" },
        { status: 400 },
      );
    }

    const menuId =
      body.menuId === undefined ? DEFAULT_MENU_ID : parseMenuId(body.menuId);
    const menuIndex =
      body.menuIndex === undefined ? null : parseMenuIndex(body.menuIndex);

    const [existingCategory, existingMenu] = await Promise.all([
      prisma.category.findUnique({
        where: {
          id: normalizedCategoryId,
        },
        select: {
          id: true,
        },
      }),
      prisma.menu.findUnique({
        where: {
          id: menuId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Invalid payload", field: "menuId" },
        { status: 400 },
      );
    }

    const rows = await prisma.$queryRaw<{ menuId: string; menuIndex: number | null }[]>`
      INSERT INTO "MenuCategory" ("menuId", "categoryId", "menuIndex")
      VALUES (${menuId}, ${normalizedCategoryId}, ${menuIndex})
      ON CONFLICT ("menuId", "categoryId")
      DO UPDATE SET "menuIndex" = EXCLUDED."menuIndex"
      RETURNING "menuId", "menuIndex"
    `;

    const updatedCategoryMenu = rows[0];

    if (!updatedCategoryMenu) {
      throw new Error("menuIndex");
    }

    return NextResponse.json({
      id: normalizedCategoryId,
      menuId: updatedCategoryMenu.menuId,
      menuIndex: updatedCategoryMenu.menuIndex,
    });
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
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    console.error("PATCH /api/categories/[categoryId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { categoryId } = await context.params;
    const normalizedCategoryId = categoryId.trim();

    if (!normalizedCategoryId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "categoryId" },
        { status: 400 },
      );
    }

    const menuIdFromQuery = request.nextUrl.searchParams.get("menuId");
    const menuId = menuIdFromQuery
      ? parseMenuId(menuIdFromQuery)
      : DEFAULT_MENU_ID;

    const [existingCategory, existingMenu] = await Promise.all([
      prisma.category.findUnique({
        where: {
          id: normalizedCategoryId,
        },
        select: {
          id: true,
        },
      }),
      prisma.menu.findUnique({
        where: {
          id: menuId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Invalid payload", field: "menuId" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "MenuCategory"
        WHERE "menuId" = ${menuId}
          AND "categoryId" = ${normalizedCategoryId}
      `;

      await tx.$executeRaw`
        WITH ranked AS (
          SELECT
            mc."menuId",
            mc."categoryId",
            ROW_NUMBER() OVER (
              ORDER BY
                COALESCE(mc."menuIndex", 2147483647) ASC,
                mc."createdAt" ASC,
                mc."categoryId" ASC
            ) AS "nextIndex"
          FROM "MenuCategory" mc
          WHERE mc."menuId" = ${menuId}
        )
        UPDATE "MenuCategory" mc
        SET "menuIndex" = ranked."nextIndex"
        FROM ranked
        WHERE mc."menuId" = ranked."menuId"
          AND mc."categoryId" = ranked."categoryId"
      `;
    });

    return NextResponse.json({
      id: normalizedCategoryId,
      menuId,
      detached: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("DELETE /api/categories/[categoryId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
