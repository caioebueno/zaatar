import updateOrderPaymentAndDelivery from "@/src/updateOrderPaymentAndDelivery";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type PatchBody = {
  paidAt?: unknown;
  paymentMethod?: unknown;
  deliveredAt?: unknown;
  orderType?: unknown;
  type?: unknown;
  customerId?: unknown;
  addressId?: unknown;
  orderProducts?: unknown;
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

  if (code === "INVALID_PARAMS") {
    return NextResponse.json(
      { error: "Invalid payload", ...(field ? { field } : {}) },
      { status: 400 },
    );
  }

  if (code === "NOT_FOUND") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as PatchBody;

    const order = await updateOrderPaymentAndDelivery({
      orderId,
      paidAt: body.paidAt,
      paymentMethod: body.paymentMethod,
      deliveredAt: body.deliveredAt,
      orderType: body.orderType ?? body.type,
      customerId: body.customerId,
      addressId: body.addressId,
      orderProducts: body.orderProducts,
    });

    return NextResponse.json(order);
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    console.error("PATCH /api/orders/[orderId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
