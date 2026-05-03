import prisma from "@/prisma";
import { ExclusivePromotionWeekday } from "@/src/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  id?: unknown;
  name?: unknown;
  active?: unknown;
  expireAt?: unknown;
  validWeekdays?: unknown;
  productIds?: unknown;
};

const VALID_WEEKDAYS = new Set([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

function parseString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

function parseBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

function parseProductIds(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(field);
  }

  const normalizedProductIds = value.map((item) => parseString(item, field));

  return Array.from(new Set(normalizedProductIds));
}

function parseOptionalExpireAt(value: unknown, field: string): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();
  if (!normalized) return null;

  const parsedDate = new Date(normalized);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(field);
  }

  return parsedDate;
}

function parseValidWeekdays(
  value: unknown,
  field: string,
): ExclusivePromotionWeekday[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(field);
  }

  const normalizedWeekdays = value.map((item) => {
    if (typeof item !== "string") {
      throw new Error(field);
    }
    const normalized = item.trim().toUpperCase();
    if (!VALID_WEEKDAYS.has(normalized)) {
      throw new Error(field);
    }
    return normalized;
  });

  return Array.from(new Set(normalizedWeekdays)) as ExclusivePromotionWeekday[];
}

function createId(): string {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET() {
  try {
    const promotions = await prisma.exclusivePromotion.findMany({
      include: {
        products: {
          select: {
            productId: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(
      promotions.map((promotion) => ({
        id: promotion.id,
        createdAt: promotion.createdAt.toISOString(),
        updatedAt: promotion.updatedAt.toISOString(),
        name: promotion.name,
        active: promotion.active,
        expireAt: promotion.expireAt ? promotion.expireAt.toISOString() : null,
        validWeekdays: promotion.validWeekdays,
        productIds: promotion.products.map((product) => product.productId),
      })),
    );
  } catch (error) {
    console.error("GET /api/exclusive-promotions error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;
    const id = body.id === undefined ? createId() : parseString(body.id, "id");
    const name = parseString(body.name, "name");
    const active =
      body.active === undefined ? true : parseBoolean(body.active, "active");
    const expireAt = parseOptionalExpireAt(body.expireAt, "expireAt");
    const validWeekdays = parseValidWeekdays(
      body.validWeekdays,
      "validWeekdays",
    );
    const productIds = parseProductIds(body.productIds, "productIds");

    if (productIds.length > 0) {
      const existingProducts = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingProducts.length !== productIds.length) {
        return NextResponse.json(
          { error: "Invalid payload", field: "productIds" },
          { status: 400 },
        );
      }
    }

    const promotion = await prisma.$transaction(async (tx) => {
      const createdPromotion = await tx.exclusivePromotion.create({
        data: {
          id,
          name,
          active,
          expireAt,
          validWeekdays,
        },
      });

      if (productIds.length > 0) {
        await tx.exclusivePromotionProduct.createMany({
          data: productIds.map((productId) => ({
            promotionId: createdPromotion.id,
            productId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.exclusivePromotion.findUnique({
        where: {
          id: createdPromotion.id,
        },
        include: {
          products: {
            select: {
              productId: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    });

    if (!promotion) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        id: promotion.id,
        createdAt: promotion.createdAt.toISOString(),
        updatedAt: promotion.updatedAt.toISOString(),
        name: promotion.name,
        active: promotion.active,
        expireAt: promotion.expireAt ? promotion.expireAt.toISOString() : null,
        validWeekdays: promotion.validWeekdays,
        productIds: promotion.products.map((product) => product.productId),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Exclusive promotion already exists", field: "id" },
        { status: 409 },
      );
    }

    console.error("POST /api/exclusive-promotions error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
