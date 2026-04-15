import prisma from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    categoryId: string;
  }>;
};

type PatchBody = {
  menuIndex?: unknown;
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

    if (body.menuIndex === undefined) {
      return NextResponse.json(
        { error: "Invalid payload", field: "menuIndex" },
        { status: 400 },
      );
    }

    const menuIndex = parseMenuIndex(body.menuIndex);

    const updatedCategory = await prisma.category.update({
      where: {
        id: normalizedCategoryId,
      },
      data: {
        menuIndex,
      },
      select: {
        id: true,
        menuIndex: true,
      },
    });

    return NextResponse.json(updatedCategory);
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
