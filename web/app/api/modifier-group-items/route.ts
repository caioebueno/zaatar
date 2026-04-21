import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  id?: unknown;
  modifierGroupId?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  translations?: unknown;
  fileId?: unknown;
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

function parseNullableString(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  return normalized || null;
}

function parseNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(field);
  }

  if (value < 0) {
    throw new Error(field);
  }

  return value;
}

function createUuid() {
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
    const modifierGroupId = parseString(body.modifierGroupId, "modifierGroupId");
    const name = parseString(body.name, "name");
    const description = parseNullableString(body.description, "description");
    const price = parseNonNegativeInteger(body.price, "price");

    const modifierGroup = await prisma.modifierGroup.findUnique({
      where: {
        id: modifierGroupId,
      },
      select: {
        id: true,
      },
    });

    if (!modifierGroup) {
      return NextResponse.json(
        { error: "Invalid payload", field: "modifierGroupId" },
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

    let connectFileId: string | null = null;
    if (body.fileId !== undefined) {
      connectFileId = parseNullableString(body.fileId, "fileId");

      if (connectFileId) {
        const file = await prisma.file.findUnique({
          where: {
            id: connectFileId,
          },
          select: {
            id: true,
          },
        });

        if (!file) {
          return NextResponse.json(
            { error: "Invalid payload", field: "fileId" },
            { status: 400 },
          );
        }
      }
    }

    const modifierGroupItemId =
      body.id === undefined ? createUuid() : parseString(body.id, "id");

    const createdModifierGroupItem = await prisma.modifierGroupItem.create({
      data: {
        id: modifierGroupItemId,
        name,
        description,
        price,
        modifierGroup: {
          connect: {
            id: modifierGroupId,
          },
        },
        translations:
          body.translations === undefined
            ? undefined
            : body.translations === null
              ? Prisma.JsonNull
              : (body.translations as Prisma.InputJsonValue),
        ...(connectFileId
          ? {
              photo: {
                connect: {
                  id: connectFileId,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        modifierGroupId: true,
        name: true,
        description: true,
        price: true,
        translations: true,
        photo: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    return NextResponse.json(createdModifierGroupItem);
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
        { error: "Modifier group item already exists", field: "id" },
        { status: 409 },
      );
    }

    console.error("POST /api/modifier-group-items error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
