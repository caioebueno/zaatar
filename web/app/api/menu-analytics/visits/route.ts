import prisma from "@/prisma";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type VisitPayload = {
  visitorId?: unknown;
  visitKey?: unknown;
  menuId?: unknown;
  promotionId?: unknown;
  language?: unknown;
  pathname?: unknown;
  referrer?: unknown;
};

function readString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

function readOptionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function extractClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip")?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VisitPayload;
    const visitorId = readString(body.visitorId, "visitorId");
    const visitKey = readString(body.visitKey, "visitKey");
    const pathname = readString(body.pathname, "pathname");
    const menuId = readOptionalString(body.menuId, "menuId");
    const promotionId = readOptionalString(body.promotionId, "promotionId");
    const language = readOptionalString(body.language, "language");
    const referrer = readOptionalString(body.referrer, "referrer");
    const userAgent = readOptionalString(
      request.headers.get("user-agent"),
      "userAgent",
    );
    const ipAddress = extractClientIp(request);

    await prisma.$executeRaw`
      INSERT INTO "MenuVisit" (
        "id",
        "visitorId",
        "visitKey",
        "menuId",
        "promotionId",
        "language",
        "pathname",
        "referrer",
        "userAgent",
        "ipAddress"
      )
      VALUES (
        ${randomUUID()},
        ${visitorId},
        ${visitKey},
        ${menuId},
        ${promotionId},
        ${language},
        ${pathname},
        ${referrer},
        ${userAgent},
        ${ipAddress}
      )
      ON CONFLICT ("visitorId", "visitKey") DO NOTHING
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("POST /api/menu-analytics/visits error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
