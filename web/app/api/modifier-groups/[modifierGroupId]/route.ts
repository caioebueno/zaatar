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

    const body = (await request.json()) as PatchBody;
    const data: Prisma.ModifierGroupUpdateInput = {};
    let hasAnyField = false;
    let translationsToPersist: unknown | null | undefined = undefined;

    if (body.title !== undefined) {
      data.title = parseString(body.title, "title");
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

    const [existingModifierGroup] = await prisma.$queryRaw<
      { id: string }[]
    >`
      SELECT "id"
      FROM "ModifierGroup"
      WHERE "id" = ${normalizedModifierGroupId}
      LIMIT 1
    `;

    if (!existingModifierGroup) {
      return NextResponse.json(
        { error: "Modifier group not found" },
        { status: 404 },
      );
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
        translations: unknown | null;
      }[]
    >`
      SELECT "id", "title", "translations"
      FROM "ModifierGroup"
      WHERE "id" = ${normalizedModifierGroupId}
      LIMIT 1
    `;

    return NextResponse.json({
      id: updatedModifierGroup.id,
      title: updatedModifierGroup.title,
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
