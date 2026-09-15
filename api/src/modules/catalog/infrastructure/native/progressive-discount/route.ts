import { Prisma } from "../../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../../prisma.js";
import { NextResponse } from "../shared/http.js";

type PrizeTranslationsRow = {
  id: string;
  translations: Prisma.JsonValue | null;
};

type DiscountStepInput = {
  amount?: unknown;
  discount?: unknown;
  type?: unknown;
};

type DiscountBody = {
  completed?: unknown;
  steps?: unknown;
};

const discountInclude = {
  steps: {
    orderBy: { amount: "asc" as const },
    include: {
      prizes: {
        orderBy: { createdAt: "asc" as const },
        include: {
          products: {
            orderBy: { createdAt: "asc" as const },
            include: {
              product: {
                include: {
                  photos: {
                    orderBy: { createdAt: "asc" as const },
                    select: { id: true, url: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

type DiscountWithRelations = Prisma.ProgressiveDiscountGetPayload<{
  include: typeof discountInclude;
}>;

function parsePrizeTranslations(value: unknown): Record<string, unknown> | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseSteps(value: unknown): Array<{
  amount: number;
  discount: number | null;
  discountType: "PERCENTAGEDISCOUNT" | "GIFT";
}> {
  if (!Array.isArray(value) || value.length === 0) throw new Error("steps");

  return value.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("steps");
    const step = raw as DiscountStepInput;
    if (!Number.isInteger(step.amount) || (step.amount as number) < 0) throw new Error("steps.amount");
    if (step.type !== "PERCENTAGEDISCOUNT" && step.type !== "GIFT") throw new Error("steps.type");
    if (step.type === "PERCENTAGEDISCOUNT") {
      if (!Number.isInteger(step.discount) || (step.discount as number) < 0) throw new Error("steps.discount");
    } else if (step.discount !== undefined && step.discount !== null) {
      throw new Error("steps.discount");
    }
    return {
      amount: step.amount as number,
      discount: step.type === "PERCENTAGEDISCOUNT" ? (step.discount as number) : null,
      discountType: step.type,
    };
  });
}

function parseCompleted(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("completed");
  return value;
}

async function serializeDiscount(discount: DiscountWithRelations) {
  const prizeIds = discount.steps.flatMap((step) => step.prizes.map((prize) => prize.id));
  const translationsByPrizeId = prizeIds.length
    ? new Map(
        (await prisma.$queryRaw<PrizeTranslationsRow[]>`
          SELECT "id", "translations" FROM "ProgressiveDiscountPrize"
          WHERE "id" IN (${Prisma.join(prizeIds)})
        `).map((row) => [row.id, parsePrizeTranslations(row.translations)]),
      )
    : new Map<string, Record<string, unknown> | undefined>();

  return {
    id: discount.id,
    createdAt: discount.createdAt.toISOString(),
    completed: discount.completed,
    steps: discount.steps.map((step) => ({
      id: step.id,
      type: step.discountType,
      amount: step.amount,
      discount: step.discount,
      prizes: step.prizes.map((prize) => ({
        id: prize.id,
        createdAt: prize.createdAt.toISOString(),
        name: prize.name,
        translations: translationsByPrizeId.get(prize.id) ?? parsePrizeTranslations(prize.translations),
        quantity: prize.quantity,
        imageUrl: prize.imageUrl,
        progressiveDiscountStepId: prize.progressiveDiscountStepId,
        products: prize.products.map((prizeProduct) => ({
          id: prizeProduct.product.id,
          name: prizeProduct.product.name,
          translations: parsePrizeTranslations(prizeProduct.product.translations),
          price: prizeProduct.product.price,
          comparedAtPrice: prizeProduct.product.comparedAtPrice,
          photos: prizeProduct.product.photos.map((photo) => ({ id: photo.id, url: photo.url })),
        })),
      })),
    })),
  };
}

async function findDiscount(id: string) {
  return prisma.progressiveDiscount.findUnique({ where: { id }, include: discountInclude });
}

export async function GET() {
  try {
    // Only an open ladder is offered. There is deliberately no fallback to the
    // newest completed one: completing every ladder must mean "no discount",
    // otherwise an operator cannot switch the promotion off.
    const activeDiscount = await prisma.progressiveDiscount.findFirst({
      where: { completed: false },
      include: discountInclude,
      orderBy: { createdAt: "desc" },
    });

    if (!activeDiscount) {
      return NextResponse.json(null);
    }

    return NextResponse.json(await serializeDiscount(activeDiscount));
  } catch (error) {
    console.error("GET /progressive-discount error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /progressive-discount/all — every ladder, newest first, so the manager can
 * pick which one runs. `GET /progressive-discount` stays the storefront's view
 * (the single active ladder).
 */
export async function LIST() {
  try {
    const discounts = await prisma.progressiveDiscount.findMany({
      include: discountInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(await Promise.all(discounts.map(serializeDiscount)));
  } catch (error) {
    console.error("GET /progressive-discount/all error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: { json: () => Promise<unknown> }) {
  try {
    const body = (await request.json()) as DiscountBody;
    const steps = parseSteps(body.steps);
    const completed = body.completed === undefined ? false : parseCompleted(body.completed);
    const id = createId();
    await prisma.progressiveDiscount.create({
      data: { id, completed, steps: { create: steps.map((step) => ({ id: createId(), ...step })) } },
    });
    return NextResponse.json(await serializeDiscount((await findDiscount(id))!), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message) return NextResponse.json({ error: "Invalid payload", field: error.message }, { status: 400 });
    console.error("POST /progressive-discount error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: { json: () => Promise<unknown> }, id: string) {
  try {
    if (!id.trim()) return NextResponse.json({ error: "Invalid payload", field: "id" }, { status: 400 });
    const body = (await request.json()) as DiscountBody;
    if (body.completed === undefined && body.steps === undefined) throw new Error("completed|steps");
    const existing = await findDiscount(id);
    if (!existing) return NextResponse.json({ error: "Progressive discount not found" }, { status: 404 });
    const steps = body.steps === undefined ? undefined : parseSteps(body.steps);
    await prisma.$transaction(async (tx) => {
      if (steps) {
        await tx.progressiveDiscountStep.deleteMany({ where: { progressiveDiscountId: id } });
      }
      await tx.progressiveDiscount.update({
        where: { id },
        data: {
          ...(body.completed === undefined ? {} : { completed: parseCompleted(body.completed) }),
          ...(steps ? { steps: { create: steps.map((step) => ({ id: createId(), ...step })) } } : {}),
        },
      });
    });
    return NextResponse.json(await serializeDiscount((await findDiscount(id))!));
  } catch (error) {
    if (error instanceof Error && error.message) return NextResponse.json({ error: "Invalid payload", field: error.message }, { status: 400 });
    console.error("PATCH /progressive-discount/:id error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(id: string) {
  if (!id.trim()) return NextResponse.json({ error: "Invalid payload", field: "id" }, { status: 400 });
  const existing = await findDiscount(id);
  if (!existing) return NextResponse.json({ error: "Progressive discount not found" }, { status: 404 });
  await prisma.$transaction(async (tx) => {
    await tx.progressiveDiscountStep.deleteMany({ where: { progressiveDiscountId: id } });
    await tx.progressiveDiscount.delete({ where: { id } });
  });
  return NextResponse.json(null, { status: 204 });
}
