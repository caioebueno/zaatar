import {
  createProgressiveDiscountPrize,
  listProgressiveDiscountPrizes,
} from "@/src/manageProgressiveDiscountPrizes";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  progressiveDiscountStepId?: unknown;
  name?: unknown;
  quantity?: unknown;
  imageUrl?: unknown;
  productIds?: unknown;
};

function mapKnownError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: string }).code;
  const field =
    "details" in error &&
    typeof (error as { details?: { field?: string } }).details?.field === "string"
      ? (error as { details?: { field?: string } }).details?.field
      : undefined;
  const service =
    "details" in error &&
    typeof (error as { details?: { service?: string } }).details?.service ===
      "string"
      ? (error as { details?: { service?: string } }).details?.service
      : undefined;

  if (code === "INVALID_PARAMS") {
    return NextResponse.json(
      { error: "Invalid payload", ...(field ? { field } : {}) },
      { status: 400 },
    );
  }

  if (code === "NOT_FOUND") {
    if (service === "PROGRESSIVE_DISCOUNT_STEP") {
      return NextResponse.json(
        { error: "Progressive discount step not found" },
        { status: 404 },
      );
    }

    if (service === "PRODUCT") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const progressiveDiscountStepId =
      request.nextUrl.searchParams.get("progressiveDiscountStepId") ?? undefined;

    const prizes = await listProgressiveDiscountPrizes({
      progressiveDiscountStepId,
    });

    return NextResponse.json(prizes);
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    console.error("GET /api/progressive-discount/prizes error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;

    const prize = await createProgressiveDiscountPrize({
      progressiveDiscountStepId: body.progressiveDiscountStepId,
      name: body.name,
      quantity: body.quantity,
      imageUrl: body.imageUrl,
      productIds: body.productIds,
    });

    return NextResponse.json(prize, { status: 201 });
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    console.error("POST /api/progressive-discount/prizes error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
