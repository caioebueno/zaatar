import prisma from "../../../../../prisma.js";
import { DEFAULT_MENU_ID } from "../constants/menu.js";

import type { HttpResponse } from "../../../../../shared/http/types.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

type PostBody = {
  id?: unknown;
  name?: unknown;
  menuId?: unknown;
  menuIndex?: unknown;
};

function parseString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

function parseOptionalInt(value: unknown, field: string): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(field);
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(field);
  }

  return value;
}

function createId(): string {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: NextRequestLike) {
  try {
    const menuId = request.nextUrl.searchParams.get("menuId");
    const normalizedMenuId =
      typeof menuId === "string" && menuId.trim().length > 0
        ? menuId.trim()
        : DEFAULT_MENU_ID;
    const categories = await prisma.$queryRaw<
      { id: string; title: string; menuIndex: number | null }[]
    >`
      SELECT
        c."id" AS "id",
        c."name" AS "title",
        mc."menuIndex" AS "menuIndex"
      FROM "MenuCategory" mc
      INNER JOIN "Category" c ON c."id" = mc."categoryId"
      WHERE mc."menuId" = ${normalizedMenuId}
      ORDER BY
        COALESCE(mc."menuIndex", 2147483647) ASC,
        mc."createdAt" ASC
    `;

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequestLike) {
  try {
    const body = (await request.json()) as PostBody;
    const id =
      body.id === undefined ? createId() : parseString(body.id, "id");
    const name = parseString(body.name, "name");
    const menuId = parseString(body.menuId, "menuId");
    const menuIndex = parseOptionalInt(body.menuIndex, "menuIndex");

    const existingMenu = await prisma.menu.findUnique({
      where: {
        id: menuId,
      },
      select: {
        id: true,
      },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Invalid payload", field: "menuId" },
        { status: 400 },
      );
    }

    const createdCategory = await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          id,
          name,
          menuId,
          menuIndex,
        },
        select: {
          id: true,
          name: true,
        },
      });

      await tx.$executeRaw`
        INSERT INTO "MenuCategory" ("menuId", "categoryId", "menuIndex")
        VALUES (${menuId}, ${category.id}, ${menuIndex})
        ON CONFLICT ("menuId", "categoryId")
        DO UPDATE SET "menuIndex" = EXCLUDED."menuIndex"
      `;

      return category;
    });

    return NextResponse.json(
      {
        id: createdCategory.id,
        name: createdCategory.name,
        menuId,
        menuIndex,
      },
      { status: 201 },
    );
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
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Category already exists", field: "id" },
        { status: 409 },
      );
    }

    console.error("POST /api/categories error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
