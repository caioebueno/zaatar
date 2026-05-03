import prisma from "@/prisma";
import { ExclusivePromotionWeekday } from "@/src/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    promotionId: string;
  }>;
};

type PatchBody = {
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

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  return parseString(value, field);
}

function parseOptionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(field);
  }

  return value;
}

function parseProductIds(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) {
    throw new Error(field);
  }

  const normalizedProductIds = value.map((item) => parseString(item, field));
  return Array.from(new Set(normalizedProductIds));
}

function parseOptionalExpireAt(value: unknown, field: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
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
): ExclusivePromotionWeekday[] | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
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

  return Array.from(
    new Set(normalizedWeekdays),
  ) as ExclusivePromotionWeekday[];
}

async function validateProductIds(productIds: string[]): Promise<boolean> {
  if (productIds.length === 0) return true;

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

  return existingProducts.length === productIds.length;
}

function toResponsePayload(promotion: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  active: boolean;
  expireAt: Date | null;
  validWeekdays: ExclusivePromotionWeekday[];
  products: {
    productId: string;
  }[];
}) {
  return {
    id: promotion.id,
    createdAt: promotion.createdAt.toISOString(),
    updatedAt: promotion.updatedAt.toISOString(),
    name: promotion.name,
    active: promotion.active,
    expireAt: promotion.expireAt ? promotion.expireAt.toISOString() : null,
    validWeekdays: promotion.validWeekdays,
    productIds: promotion.products.map((product) => product.productId),
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const promotionId = parseString(
      (await context.params).promotionId,
      "promotionId",
    );

    const promotion = await prisma.exclusivePromotion.findUnique({
      where: {
        id: promotionId,
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

    if (!promotion) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(toResponsePayload(promotion));
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("GET /api/exclusive-promotions/[promotionId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const promotionId = parseString(
      (await context.params).promotionId,
      "promotionId",
    );
    const body = (await request.json()) as PatchBody;
    const name = parseOptionalString(body.name, "name");
    const active = parseOptionalBoolean(body.active, "active");
    const expireAt = parseOptionalExpireAt(body.expireAt, "expireAt");
    const validWeekdays = parseValidWeekdays(
      body.validWeekdays,
      "validWeekdays",
    );
    const productIds = parseProductIds(body.productIds, "productIds");

    const existingPromotion = await prisma.exclusivePromotion.findUnique({
      where: {
        id: promotionId,
      },
      select: {
        id: true,
      },
    });

    if (!existingPromotion) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      );
    }

    if (productIds !== undefined) {
      const validProductIds = await validateProductIds(productIds);
      if (!validProductIds) {
        return NextResponse.json(
          { error: "Invalid payload", field: "productIds" },
          { status: 400 },
        );
      }
    }

    const updatedPromotion = await prisma.$transaction(async (tx) => {
      if (
        name !== undefined ||
        active !== undefined ||
        expireAt !== undefined ||
        validWeekdays !== undefined
      ) {
        await tx.exclusivePromotion.update({
          where: {
            id: promotionId,
          },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(active !== undefined ? { active } : {}),
            ...(expireAt !== undefined ? { expireAt } : {}),
            ...(validWeekdays !== undefined ? { validWeekdays } : {}),
          },
        });
      }

      if (productIds !== undefined) {
        await tx.exclusivePromotionProduct.deleteMany({
          where: {
            promotionId,
          },
        });

        if (productIds.length > 0) {
          await tx.exclusivePromotionProduct.createMany({
            data: productIds.map((productId) => ({
              promotionId,
              productId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.exclusivePromotion.findUnique({
        where: {
          id: promotionId,
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

    if (!updatedPromotion) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(toResponsePayload(updatedPromotion));
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("PATCH /api/exclusive-promotions/[promotionId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const promotionId = parseString(
      (await context.params).promotionId,
      "promotionId",
    );

    const existingPromotion = await prisma.exclusivePromotion.findUnique({
      where: {
        id: promotionId,
      },
      select: {
        id: true,
      },
    });

    if (!existingPromotion) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      );
    }

    await prisma.exclusivePromotion.delete({
      where: {
        id: promotionId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("DELETE /api/exclusive-promotions/[promotionId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
