import prisma from "@/prisma";
import {
  authenticateCustomerByAccessToken,
  extractAccessToken,
} from "@/app/api/customers/cards/_shared";
import { getStripeClient } from "@/src/stripe";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  accessToken?: unknown;
  paymentMethodId?: unknown;
  setDefault?: unknown;
};

type CustomerStripeRow = {
  id: string;
  stripeCustomerId: string | null;
};

type ExistingCardRow = {
  id: string;
  customerId: string;
};

type CustomerCardRow = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

function parseOptionalBoolean(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean") {
    throw new Error("setDefault");
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;
    const accessToken = extractAccessToken(request, body);
    const paymentMethodId = parseRequiredString(
      body.paymentMethodId,
      "paymentMethodId",
    );
    const setDefault = parseOptionalBoolean(body.setDefault);

    const session = await authenticateCustomerByAccessToken({
      accessToken,
      request,
    });

    const stripe = getStripeClient();
    const customerRows = await prisma.$queryRaw<CustomerStripeRow[]>`
      SELECT "id", "stripeCustomerId"
      FROM "Customer"
      WHERE "id" = ${session.customer.id}
      LIMIT 1
    `;
    const customerRecord = customerRows[0] || null;

    if (!customerRecord) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const stripeCustomerId = customerRecord.stripeCustomerId?.trim();
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer not initialized" },
        { status: 400 },
      );
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!paymentMethod || paymentMethod.type !== "card" || !paymentMethod.card) {
      return NextResponse.json(
        { error: "Invalid card payment method" },
        { status: 400 },
      );
    }
    const cardDetails = paymentMethod.card;

    if (!paymentMethod.customer) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
    }

    if (
      paymentMethod.customer &&
      typeof paymentMethod.customer === "string" &&
      paymentMethod.customer !== stripeCustomerId
    ) {
      return NextResponse.json(
        { error: "Payment method belongs to a different customer" },
        { status: 400 },
      );
    }

    if (setDefault) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    const existingCardRows = await prisma.$queryRaw<ExistingCardRow[]>`
      SELECT "id", "customerId"
      FROM "CustomerCard"
      WHERE "stripePaymentMethodId" = ${paymentMethodId}
      LIMIT 1
    `;
    const existingCard = existingCardRows[0] || null;

    if (existingCard && existingCard.customerId !== customerRecord.id) {
      return NextResponse.json(
        { error: "Payment method belongs to a different customer" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      if (setDefault) {
        await tx.$executeRaw`
          UPDATE "CustomerCard"
          SET "isDefault" = false, "updatedAt" = NOW()
          WHERE "customerId" = ${customerRecord.id}
        `;
      }

      if (existingCard) {
        await tx.$executeRaw`
          UPDATE "CustomerCard"
          SET
            "brand" = ${cardDetails.brand},
            "last4" = ${cardDetails.last4},
            "expMonth" = ${cardDetails.exp_month},
            "expYear" = ${cardDetails.exp_year},
            "funding" = ${cardDetails.funding || null},
            "country" = ${cardDetails.country || null},
            "fingerprint" = ${cardDetails.fingerprint || null},
            "isDefault" = ${setDefault},
            "updatedAt" = NOW()
          WHERE "id" = ${existingCard.id}
        `;
      } else {
        await tx.$executeRaw`
          INSERT INTO "CustomerCard" (
            "id",
            "createdAt",
            "updatedAt",
            "customerId",
            "stripePaymentMethodId",
            "brand",
            "last4",
            "expMonth",
            "expYear",
            "funding",
            "country",
            "fingerprint",
            "isDefault"
          )
          VALUES (
            ${randomUUID()},
            NOW(),
            NOW(),
            ${customerRecord.id},
            ${paymentMethodId},
            ${cardDetails.brand},
            ${cardDetails.last4},
            ${cardDetails.exp_month},
            ${cardDetails.exp_year},
            ${cardDetails.funding || null},
            ${cardDetails.country || null},
            ${cardDetails.fingerprint || null},
            ${setDefault}
          )
        `;
      }
    });

    const cards = await prisma.$queryRaw<CustomerCardRow[]>`
      SELECT
        "id",
        "brand",
        "last4",
        "expMonth",
        "expYear",
        "isDefault"
      FROM "CustomerCard"
      WHERE "customerId" = ${customerRecord.id}
      ORDER BY "isDefault" DESC, "createdAt" ASC
    `;

    return NextResponse.json({
      cards,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "accessToken" || error.message === "paymentMethodId" || error.message === "setDefault")) {
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

    console.error("POST /api/customers/cards/sync error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
