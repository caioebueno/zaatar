import prisma from "@/prisma";
import {
  authenticateCustomerByAccessToken,
  extractAccessToken,
} from "@/app/api/customers/cards/_shared";
import { NextRequest, NextResponse } from "next/server";

type CustomerCardRow = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const accessToken = extractAccessToken(request);
    const session = await authenticateCustomerByAccessToken({
      accessToken,
      request,
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

    console.error("GET /api/customers/cards error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
