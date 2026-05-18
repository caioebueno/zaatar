import prisma from "../../../../../prisma.js";
import { DEFAULT_MENU_ID, DEFAULT_MENU_NAME } from "../constants/menu.js";
import { randomUUID } from "crypto";
import type { HttpResponse } from "../../../../../shared/http/types.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

type PostBody = {
  id?: unknown;
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
  return normalizedValue || undefined;
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

async function ensureDefaultMenu(): Promise<void> {
  await prisma.menu.upsert({
    where: {
      id: DEFAULT_MENU_ID,
    },
    update: {},
    create: {
      id: DEFAULT_MENU_ID,
      name: DEFAULT_MENU_NAME,
      active: true,
      isDefault: true,
    },
  });
}

export async function GET() {
  try {
    await ensureDefaultMenu();

    const menus = await prisma.menu.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("GET /api/menus error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequestLike) {
  try {
    const body = (await request.json()) as PostBody;
    const id = parseOptionalString(body.id, "id") ?? randomUUID();
    const name = parseOptionalString(body.name, "name");
    const active = parseOptionalBoolean(body.active, "active") ?? true;
    const isDefault = parseOptionalBoolean(body.isDefault, "isDefault") ?? false;

    if (!name) {
      return NextResponse.json(
        { error: "Invalid payload", field: "name" },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.menu.updateMany({
          data: {
            isDefault: false,
          },
        });
      }

      return tx.menu.create({
        data: {
          id,
          name,
          active,
          isDefault,
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
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
      return NextResponse.json({ error: "Menu already exists" }, { status: 409 });
    }

    console.error("POST /api/menus error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
