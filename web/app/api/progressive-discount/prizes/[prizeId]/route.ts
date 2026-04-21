import { updateProgressiveDiscountPrize } from "@/src/manageProgressiveDiscountPrizes";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    prizeId: string;
  }>;
};

type PatchBody = {
  progressiveDiscountStepId?: unknown;
  name?: unknown;
  translations?: unknown;
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
    if (service === "PRIZE") {
      return NextResponse.json({ error: "Prize not found" }, { status: 404 });
    }

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { prizeId } = await context.params;
    const body = (await request.json()) as PatchBody;

    const prize = await updateProgressiveDiscountPrize({
      prizeId,
      progressiveDiscountStepId: body.progressiveDiscountStepId,
      name: body.name,
      translations: body.translations,
      quantity: body.quantity,
      imageUrl: body.imageUrl,
      productIds: body.productIds,
    });

    return NextResponse.json(prize);
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    console.error(
      "PATCH /api/progressive-discount/prizes/[prizeId] error:",
      error,
    );

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
