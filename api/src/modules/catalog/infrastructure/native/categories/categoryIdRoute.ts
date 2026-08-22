import prisma from "../../../../../prisma.js";
import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";
import { DEFAULT_MENU_ID } from "../constants/menu.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

type RouteContext = {
  params: Promise<{
    categoryId: string;
  }>;
};

type PatchBody = {
  menuIndex?: unknown;
  menuId?: unknown;
};

type MenuCategoryRow = {
  categoryId: string;
  menuIndex: number | null;
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

function resolveNextCategoryOrder(input: {
  categoryId: string;
  categoryExistsInMenu: boolean;
  currentIds: string[];
  menuIndexProvided: boolean;
  requestedMenuIndex: number | null;
}): string[] {
  const remainingIds = input.currentIds.filter((id) => id !== input.categoryId);

  if (!input.menuIndexProvided) {
    return input.categoryExistsInMenu
      ? input.currentIds
      : [...remainingIds, input.categoryId];
  }

  if (input.requestedMenuIndex === null) {
    return [...remainingIds, input.categoryId];
  }

  const desiredPosition = Math.min(
    Math.max(input.requestedMenuIndex, 1),
    remainingIds.length + 1,
  );
  const nextIds = remainingIds.slice();
  nextIds.splice(desiredPosition - 1, 0, input.categoryId);
  return nextIds;
}

async function normalizeMenuCategoryIndexes(
  tx: Prisma.TransactionClient,
  menuId: string,
  orderedCategoryIds: string[],
): Promise<void> {
  for (const [index, categoryId] of orderedCategoryIds.entries()) {
    const nextIndex = index + 1;
    await tx.$executeRaw`
      UPDATE "MenuCategory"
      SET "menuIndex" = ${nextIndex}
      WHERE "menuId" = ${menuId}
        AND "categoryId" = ${categoryId}
    `;
  }
}

export async function PATCH(request: NextRequestLike, context: RouteContext) {
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

    const updatedCategoryMenu = await prisma.$transaction(async (tx) => {
      const currentMenuCategories = await tx.$queryRaw<MenuCategoryRow[]>`
        SELECT
          mc."categoryId" AS "categoryId",
          mc."menuIndex" AS "menuIndex"
        FROM "MenuCategory" mc
        WHERE mc."menuId" = ${menuId}
        ORDER BY
          COALESCE(mc."menuIndex", 2147483647) ASC,
          mc."createdAt" ASC,
          mc."categoryId" ASC
      `;

      const currentIds = currentMenuCategories.map((row) => row.categoryId);
      const categoryExistsInMenu = currentIds.includes(normalizedCategoryId);
      const orderedCategoryIds = resolveNextCategoryOrder({
        categoryId: normalizedCategoryId,
        categoryExistsInMenu,
        currentIds,
        menuIndexProvided: body.menuIndex !== undefined,
        requestedMenuIndex: menuIndex,
      });

      if (!categoryExistsInMenu) {
        await tx.$executeRaw`
          INSERT INTO "MenuCategory" ("menuId", "categoryId", "menuIndex")
          VALUES (${menuId}, ${normalizedCategoryId}, NULL)
          ON CONFLICT ("menuId", "categoryId")
          DO NOTHING
        `;
      }

      await normalizeMenuCategoryIndexes(tx, menuId, orderedCategoryIds);

      return {
        menuId,
        menuIndex: orderedCategoryIds.indexOf(normalizedCategoryId) + 1,
      };
    });

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

export async function DELETE(request: NextRequestLike, context: RouteContext) {
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
