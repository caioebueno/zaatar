import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    modifierGroupId: string;
  }>;
};

type PatchBody = {
  title?: unknown;
  translations?: unknown;
  required?: unknown;
  type?: unknown;
  minSelection?: unknown;
  maxSelection?: unknown;
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

function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

function parseNullableInt(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(field);
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(field);
  }

  return value;
}

function parseModifierGroupType(
  value: unknown,
  field: string,
): "MULTI" | "SINGLE" | null {
  if (value === null) return null;
  if (value !== "MULTI" && value !== "SINGLE") {
    throw new Error(field);
  }

  return value;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { modifierGroupId } = await context.params;
    const normalizedModifierGroupId = modifierGroupId.trim();

    if (!normalizedModifierGroupId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "modifierGroupId" },
        { status: 400 },
      );
    }

    const existingModifierGroup = await prisma.modifierGroup.findUnique({
      where: {
        id: normalizedModifierGroupId,
      },
      select: {
        id: true,
        minSelection: true,
        maxSelection: true,
      },
    });

    if (!existingModifierGroup) {
      return NextResponse.json(
        { error: "Modifier group not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as PatchBody;
    const data: Prisma.ModifierGroupUpdateInput = {};
    let hasAnyField = false;
    let translationsToPersist: unknown | null | undefined = undefined;

    if (body.title !== undefined) {
      data.title = parseString(body.title, "title");
      hasAnyField = true;
    }

    if (body.required !== undefined) {
      data.required = parseBoolean(body.required, "required");
      hasAnyField = true;
    }

    if (body.type !== undefined) {
      data.type = parseModifierGroupType(body.type, "type");
      hasAnyField = true;
    }

    const nextMinSelection =
      body.minSelection !== undefined
        ? parseNullableInt(body.minSelection, "minSelection")
        : existingModifierGroup.minSelection;
    const nextMaxSelection =
      body.maxSelection !== undefined
        ? parseNullableInt(body.maxSelection, "maxSelection")
        : existingModifierGroup.maxSelection;

    if (
      nextMinSelection !== null &&
      nextMaxSelection !== null &&
      nextMinSelection > nextMaxSelection
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "minSelection" },
        { status: 400 },
      );
    }

    if (body.minSelection !== undefined) {
      data.minSelection = nextMinSelection;
      hasAnyField = true;
    }

    if (body.maxSelection !== undefined) {
      data.maxSelection = nextMaxSelection;
      hasAnyField = true;
    }

    if (body.translations !== undefined) {
      if (
        body.translations !== null &&
        (typeof body.translations !== "object" ||
          Array.isArray(body.translations))
      ) {
        return NextResponse.json(
          { error: "Invalid payload", field: "translations" },
          { status: 400 },
        );
      }

      translationsToPersist = body.translations;
      hasAnyField = true;
    }

    if (!hasAnyField) {
      return NextResponse.json(
        { error: "Invalid payload", field: "body" },
        { status: 400 },
      );
    }

    if (translationsToPersist !== undefined) {
      await prisma.$executeRaw`
        ALTER TABLE "ModifierGroup"
        ADD COLUMN IF NOT EXISTS "translations" jsonb
      `;
    }

    if (Object.keys(data).length > 0) {
      await prisma.modifierGroup.update({
        where: {
          id: normalizedModifierGroupId,
        },
        data,
      });
    }

    if (translationsToPersist !== undefined) {
      if (translationsToPersist === null) {
        await prisma.$executeRaw`
          UPDATE "ModifierGroup"
          SET "translations" = NULL
          WHERE "id" = ${normalizedModifierGroupId}
        `;
      } else {
        const serializedTranslations = JSON.stringify(translationsToPersist);
        await prisma.$executeRaw`
          UPDATE "ModifierGroup"
          SET "translations" = ${serializedTranslations}::jsonb
          WHERE "id" = ${normalizedModifierGroupId}
        `;
      }
    }

    const [updatedModifierGroup] = await prisma.$queryRaw<
      {
        id: string;
        title: string;
        required: boolean;
        type: "MULTI" | "SINGLE" | null;
        minSelection: number | null;
        maxSelection: number | null;
        translations: unknown | null;
      }[]
    >`
      SELECT
        "id",
        "title",
        "required",
        "type",
        "minSelection",
        "maxSelection",
        "translations"
      FROM "ModifierGroup"
      WHERE "id" = ${normalizedModifierGroupId}
      LIMIT 1
    `;

    return NextResponse.json({
      id: updatedModifierGroup.id,
      title: updatedModifierGroup.title,
      required: updatedModifierGroup.required,
      type: updatedModifierGroup.type,
      minSelection: updatedModifierGroup.minSelection,
      maxSelection: updatedModifierGroup.maxSelection,
      translations: updatedModifierGroup.translations ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("PATCH /api/modifier-groups/[modifierGroupId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { modifierGroupId } = await context.params;
    const normalizedModifierGroupId = modifierGroupId.trim();

    if (!normalizedModifierGroupId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "modifierGroupId" },
        { status: 400 },
      );
    }

    await prisma.modifierGroup.delete({
      where: {
        id: normalizedModifierGroupId,
      },
    });

    return NextResponse.json({
      id: normalizedModifierGroupId,
      deleted: true,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Modifier group not found" },
        { status: 404 },
      );
    }

    console.error("DELETE /api/modifier-groups/[modifierGroupId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
