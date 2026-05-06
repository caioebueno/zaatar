import prisma from "@/prisma";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type PostBody = {
  overallRating?: unknown;
  productQuality?: unknown;
  temperature?: unknown;
  deliverySpeed?: unknown;
  serviceExperience?: unknown;
  comment?: unknown;
  language?: unknown;
};

type FeedbackSettingsRow = {
  id: string;
  active: boolean;
  rewardProductId: string | null;
  rewardQuantity: number;
};

const DEFAULT_SETTINGS_ID = "default";

function parseRating(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(field);
  }

  if (value < 1 || value > 5) {
    throw new Error(field);
  }

  return value;
}

function parseOptionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(field);

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveSentiment(overallRating: number): "NEGATIVE" | "NEUTRAL" | "POSITIVE" {
  if (overallRating <= 2) return "NEGATIVE";
  if (overallRating === 3) return "NEUTRAL";
  return "POSITIVE";
}

async function getOrCreateFeedbackSettings(): Promise<FeedbackSettingsRow> {
  await prisma.$executeRaw`
    INSERT INTO "FeedbackSettings" ("id", "createdAt", "updatedAt", "active", "rewardProductId", "rewardQuantity")
    VALUES (${DEFAULT_SETTINGS_ID}, NOW(), NOW(), true, NULL, 1)
    ON CONFLICT ("id") DO NOTHING
  `;

  const rows = await prisma.$queryRaw<FeedbackSettingsRow[]>`
    SELECT "id", "active", "rewardProductId", "rewardQuantity"
    FROM "FeedbackSettings"
    WHERE "id" = ${DEFAULT_SETTINGS_ID}
    LIMIT 1
  `;

  return rows[0];
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const normalizedOrderId = orderId.trim();

    if (!normalizedOrderId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "orderId" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as PostBody;

    const overallRating = parseRating(body.overallRating, "overallRating");
    const productQuality = parseRating(body.productQuality, "productQuality");
    const temperature = parseRating(body.temperature, "temperature");
    const deliverySpeed = parseRating(body.deliverySpeed, "deliverySpeed");
    const serviceExperience = parseRating(body.serviceExperience, "serviceExperience");
    const comment = parseOptionalString(body.comment, "comment");
    const language = parseOptionalString(body.language, "language");

    const order = await prisma.order.findUnique({
      where: { id: normalizedOrderId },
      select: {
        id: true,
        customerId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.customerId) {
      return NextResponse.json(
        { error: "Invalid order", reason: "ORDER_WITHOUT_CUSTOMER" },
        { status: 400 },
      );
    }

    const alreadySentRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "CustomerFeedback"
      WHERE "orderId" = ${normalizedOrderId}
      LIMIT 1
    `;

    if (alreadySentRows.length > 0) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
      });
    }

    const settings = await getOrCreateFeedbackSettings();
    const feedbackId = randomUUID();
    const sentiment = resolveSentiment(overallRating);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "CustomerFeedback" (
          "id",
          "createdAt",
          "updatedAt",
          "customerId",
          "orderId",
          "language",
          "overallRating",
          "sentiment",
          "productQuality",
          "temperature",
          "deliverySpeed",
          "serviceExperience",
          "comment",
          "source"
        )
        VALUES (
          ${feedbackId},
          NOW(),
          NOW(),
          ${order.customerId},
          ${normalizedOrderId},
          ${language},
          ${overallRating},
          ${sentiment},
          ${productQuality},
          ${temperature},
          ${deliverySpeed},
          ${serviceExperience},
          ${comment},
          ${"MENU_FEEDBACK"}
        )
      `;

      if (settings.active && settings.rewardProductId) {
        await tx.$executeRaw`
          INSERT INTO "CustomerReward" (
            "id",
            "createdAt",
            "updatedAt",
            "customerId",
            "status",
            "type",
            "title",
            "description",
            "quantity",
            "value",
            "productId",
            "issuedAt",
            "feedbackId",
            "issuedForOrderId"
          )
          VALUES (
            ${randomUUID()},
            NOW(),
            NOW(),
            ${order.customerId},
            ${"ACTIVE"},
            ${"FREE_PRODUCT"},
            ${"Feedback Reward"},
            ${"Reward issued after customer feedback submission."},
            ${settings.rewardQuantity},
            NULL,
            ${settings.rewardProductId},
            NOW(),
            ${feedbackId},
            ${normalizedOrderId}
          )
        `;
      }
    });

    return NextResponse.json({
      success: true,
      alreadySent: false,
      feedbackId,
      rewardIssued: Boolean(settings.active && settings.rewardProductId),
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("POST /api/feedback/[orderId] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
