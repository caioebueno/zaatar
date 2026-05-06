import prisma from "@/prisma";
import {
  authenticateCustomerByAccessToken,
  extractAccessToken,
} from "@/app/api/customers/cards/_shared";
import { getStripeClient } from "@/src/stripe";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  accessToken?: unknown;
};

type CustomerStripeRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;
    const accessToken = extractAccessToken(request, body);
    const session = await authenticateCustomerByAccessToken({
      accessToken,
      request,
    });

    const stripe = getStripeClient();
    const customerRows = await prisma.$queryRaw<CustomerStripeRow[]>`
      SELECT
        "id",
        "name",
        "email",
        "phone",
        "stripeCustomerId"
      FROM "Customer"
      WHERE "id" = ${session.customer.id}
      LIMIT 1
    `;
    const customerRecord = customerRows[0] || null;

    if (!customerRecord) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    let stripeCustomerId = customerRecord.stripeCustomerId?.trim() || "";

    if (!stripeCustomerId) {
      const createdStripeCustomer = await stripe.customers.create({
        name: customerRecord.name || undefined,
        email: customerRecord.email || undefined,
        phone: customerRecord.phone ? `+${customerRecord.phone}` : undefined,
        metadata: {
          customerId: customerRecord.id,
        },
      });

      stripeCustomerId = createdStripeCustomer.id;

      await prisma.$executeRaw`
        UPDATE "Customer"
        SET "stripeCustomerId" = ${stripeCustomerId}
        WHERE "id" = ${customerRecord.id}
      `;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: "off_session",
      payment_method_types: ["card"],
      metadata: {
        customerId: customerRecord.id,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
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

    console.error("POST /api/customers/cards/setup-intent error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
