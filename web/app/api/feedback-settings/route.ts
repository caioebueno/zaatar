import prisma from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

type PatchBody = {
  active?: unknown;
  rewardProductId?: unknown;
  rewardQuantity?: unknown;
};

type FeedbackSettingsRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  rewardProductId: string | null;
  rewardQuantity: number;
};

const DEFAULT_SETTINGS_ID = "default";

function parseOptionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  return normalized;
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(field);
  }
  return value;
}

function parseOptionalInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(field);
  }
  if (value < 1 || value > 50) {
    throw new Error(field);
  }
  return value;
}

async function getOrCreateSettings(): Promise<FeedbackSettingsRow> {
  await prisma.$executeRaw`
    INSERT INTO "FeedbackSettings" ("id", "createdAt", "updatedAt", "active", "rewardProductId", "rewardQuantity")
    VALUES (${DEFAULT_SETTINGS_ID}, NOW(), NOW(), true, NULL, 1)
    ON CONFLICT ("id") DO NOTHING
  `;

  const rows = await prisma.$queryRaw<FeedbackSettingsRow[]>`
    SELECT
      "id",
      "createdAt",
      "updatedAt",
      "active",
      "rewardProductId",
      "rewardQuantity"
    FROM "FeedbackSettings"
    WHERE "id" = ${DEFAULT_SETTINGS_ID}
    LIMIT 1
  `;

  return rows[0];
}

export async function GET() {
  try {
    const settings = await getOrCreateSettings();

    return NextResponse.json({
      id: settings.id,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
      active: settings.active,
      rewardProductId: settings.rewardProductId,
      rewardQuantity: settings.rewardQuantity,
    });
  } catch (error) {
    console.error("GET /api/feedback-settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as PatchBody;

    const active = parseOptionalBoolean(body.active, "active");
    const rewardProductId = parseOptionalString(body.rewardProductId, "rewardProductId");
    const rewardQuantity = parseOptionalInt(body.rewardQuantity, "rewardQuantity");

    if (rewardProductId) {
      const existingProduct = await prisma.product.findUnique({
        where: { id: rewardProductId },
        select: { id: true },
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: "Invalid payload", field: "rewardProductId" },
          { status: 400 },
        );
      }
    }

    await getOrCreateSettings();

    await prisma.$executeRaw`
      UPDATE "FeedbackSettings"
      SET
        "active" = COALESCE(${active}, "active"),
        "rewardProductId" = CASE
          WHEN ${body.rewardProductId === undefined} THEN "rewardProductId"
          ELSE ${rewardProductId}
        END,
        "rewardQuantity" = COALESCE(${rewardQuantity}, "rewardQuantity"),
        "updatedAt" = NOW()
      WHERE "id" = ${DEFAULT_SETTINGS_ID}
    `;

    const settings = await getOrCreateSettings();

    return NextResponse.json({
      id: settings.id,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
      active: settings.active,
      rewardProductId: settings.rewardProductId,
      rewardQuantity: settings.rewardQuantity,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("PATCH /api/feedback-settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
