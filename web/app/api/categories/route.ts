import prisma from "@/prisma";
import getProducts from "@/src/getProducts";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  try {
    const menuId = request.nextUrl.searchParams.get("menuId");
    const promotionId = request.nextUrl.searchParams.get("promotionId");
    const { categories } = await getProducts(menuId, promotionId);

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
