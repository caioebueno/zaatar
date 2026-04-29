import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  id?: unknown;
  title?: unknown;
  required?: unknown;
  type?: unknown;
  minSelection?: unknown;
  maxSelection?: unknown;
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

function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

function parseNullableInt(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
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
  if (value === null || value === undefined) return null;
  if (value !== "MULTI" && value !== "SINGLE") {
    throw new Error(field);
  }

  return value;
}

function createId() {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;
    const id = body.id === undefined ? createId() : parseString(body.id, "id");
    const title = parseString(body.title, "title");
    const required =
      body.required === undefined ? false : parseBoolean(body.required, "required");
    const type = parseModifierGroupType(body.type, "type");
    const minSelection = parseNullableInt(body.minSelection, "minSelection");
    const maxSelection = parseNullableInt(body.maxSelection, "maxSelection");

    if (
      minSelection !== null &&
      maxSelection !== null &&
      minSelection > maxSelection
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "minSelection" },
        { status: 400 },
      );
    }

    if (
      body.translations !== undefined &&
      body.translations !== null &&
      (typeof body.translations !== "object" || Array.isArray(body.translations))
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "translations" },
        { status: 400 },
      );
    }

    if (body.translations !== undefined) {
      await prisma.$executeRaw`
        ALTER TABLE "ModifierGroup"
        ADD COLUMN IF NOT EXISTS "translations" jsonb
      `;
    }

    const created = await prisma.modifierGroup.create({
      data: {
        id,
        title,
        required,
        type,
        minSelection,
        maxSelection,
        ...(body.translations === undefined
          ? {}
          : {
              translations:
                body.translations === null
                  ? Prisma.JsonNull
                  : (body.translations as Prisma.InputJsonValue),
            }),
      },
      select: {
        id: true,
        title: true,
        required: true,
        type: true,
        minSelection: true,
        maxSelection: true,
        translations: true,
      },
    });

    return NextResponse.json({
      ...created,
      items: [],
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
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Modifier group already exists", field: "id" },
        { status: 409 },
      );
    }

    console.error("POST /api/modifier-groups error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
