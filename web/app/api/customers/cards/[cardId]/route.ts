import prisma from "@/prisma";
import {
  authenticateCustomerByAccessToken,
  extractAccessToken,
} from "@/app/api/customers/cards/_shared";
import { getStripeClient } from "@/src/stripe";
import { NextRequest, NextResponse } from "next/server";

type PatchBody = {
  accessToken?: unknown;
  isDefault?: unknown;
};

type DeleteBody = {
  accessToken?: unknown;
};

type CustomerCardRow = {
  id: string;
  stripePaymentMethodId: string;
};

type CustomerStripeRow = {
  stripeCustomerId: string | null;
};

type CustomerCardListRow = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const body = (await request.json()) as PatchBody;
    const accessToken = extractAccessToken(request, body);
    const isDefault = parseBoolean(body.isDefault, "isDefault");
    const { cardId } = await params;

    if (!isDefault) {
      return NextResponse.json(
        { error: "Invalid payload", field: "isDefault" },
        { status: 400 },
      );
    }

    const session = await authenticateCustomerByAccessToken({
      accessToken,
      request,
    });

    const cardRows = await prisma.$queryRaw<CustomerCardRow[]>`
      SELECT "id", "stripePaymentMethodId"
      FROM "CustomerCard"
      WHERE "id" = ${cardId}
        AND "customerId" = ${session.customer.id}
      LIMIT 1
    `;
    const card = cardRows[0] || null;

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const customerRows = await prisma.$queryRaw<CustomerStripeRow[]>`
      SELECT "stripeCustomerId"
      FROM "Customer"
      WHERE "id" = ${session.customer.id}
      LIMIT 1
    `;
    const customer = customerRows[0] || null;

    if (customer?.stripeCustomerId) {
      try {
        const stripe = getStripeClient();
        await stripe.customers.update(customer.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: card.stripePaymentMethodId,
          },
        });
      } catch (error) {
        console.error("Failed to set Stripe default payment method:", error);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "CustomerCard"
        SET "isDefault" = false, "updatedAt" = NOW()
        WHERE "customerId" = ${session.customer.id}
      `;

      await tx.$executeRaw`
        UPDATE "CustomerCard"
        SET "isDefault" = true, "updatedAt" = NOW()
        WHERE "id" = ${card.id}
      `;
    });

    const cards = await prisma.$queryRaw<CustomerCardListRow[]>`
      SELECT
        "id",
        "brand",
        "last4",
        "expMonth",
        "expYear",
        "isDefault"
      FROM "CustomerCard"
      WHERE "customerId" = ${session.customer.id}
      ORDER BY "isDefault" DESC, "createdAt" ASC
    `;

    return NextResponse.json({
      cards,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "accessToken" || error.message === "isDefault")) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ACCESS_TOKEN_INVALID"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("PATCH /api/customers/cards/[cardId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> },
) {
  try {
    const body =
      request.headers.get("content-type")?.includes("application/json")
        ? ((await request.json()) as DeleteBody)
        : undefined;
    const accessToken = extractAccessToken(request, body);
    const { cardId } = await params;

    const session = await authenticateCustomerByAccessToken({
      accessToken,
      request,
    });

    const cardRows = await prisma.$queryRaw<CustomerCardRow[]>`
      SELECT "id", "stripePaymentMethodId"
      FROM "CustomerCard"
      WHERE "id" = ${cardId}
        AND "customerId" = ${session.customer.id}
      LIMIT 1
    `;
    const card = cardRows[0] || null;

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    try {
      const stripe = getStripeClient();
      await stripe.paymentMethods.detach(card.stripePaymentMethodId);
    } catch (error) {
      console.error("Failed to detach Stripe payment method:", error);
    }

    await prisma.$executeRaw`
      DELETE FROM "CustomerCard"
      WHERE "id" = ${card.id}
    `;

    const cards = await prisma.$queryRaw<CustomerCardListRow[]>`
      SELECT
        "id",
        "brand",
        "last4",
        "expMonth",
        "expYear",
        "isDefault"
      FROM "CustomerCard"
      WHERE "customerId" = ${session.customer.id}
      ORDER BY "isDefault" DESC, "createdAt" ASC
    `;

    return NextResponse.json({
      cards,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "accessToken") {
      return NextResponse.json(
        { error: "Invalid payload", field: "accessToken" },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ACCESS_TOKEN_INVALID"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("DELETE /api/customers/cards/[cardId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
