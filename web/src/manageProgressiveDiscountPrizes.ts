"use server";

import prisma from "@/prisma";
import { randomUUID } from "crypto";
import { Prisma } from "@/src/generated/prisma";
import {
  mapProgressiveDiscountPrize,
  progressiveDiscountPrizeInclude,
} from "@/src/progressiveDiscountPrizeHelpers";
import type { TProgressiveDiscountPrize } from "@/src/types/progressiveDiscount";

type CommonInput = {
  progressiveDiscountStepId?: unknown;
  name?: unknown;
  translations?: unknown;
  quantity?: unknown;
  imageUrl?: unknown;
  productIds?: unknown;
};

type CreateProgressiveDiscountPrizeInput = CommonInput;

type UpdateProgressiveDiscountPrizeInput = CommonInput & {
  prizeId: string;
};

type PrizeTranslationsRow = {
  id: string;
  translations: Prisma.JsonValue | null;
};

function normalizeId(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
      },
    };
  }

  const id = value.trim();

  if (!id) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
      },
    };
  }

  return id;
}

function parseProgressiveDiscountStepId(value: unknown): string {
  return normalizeId(value, "progressiveDiscountStepId");
}

function parseName(value: unknown): string {
  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "name",
      },
    };
  }

  const name = value.trim();

  if (!name) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "name",
      },
    };
  }

  return name;
}

function parseQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "quantity",
      },
    };
  }

  return value;
}

function parseImageUrl(value: unknown): string | null {
  if (value === null) return null;

  if (typeof value !== "string") {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "imageUrl",
      },
    };
  }

  const normalizedUrl = value.trim();

  if (!normalizedUrl) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "imageUrl",
      },
    };
  }

  return normalizedUrl;
}

function parseTranslations(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;

  if (typeof value !== "object" || Array.isArray(value)) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "translations",
      },
    };
  }

  return value as Prisma.InputJsonValue;
}

function parseProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "productIds",
      },
    };
  }

  const normalizedIds = value.map((item) => normalizeId(item, "productIds"));
  return Array.from(new Set(normalizedIds));
}

function parsePrizeTranslations(
  value: unknown,
): TProgressiveDiscountPrize["translations"] | undefined {
  if (!value) return undefined;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as TProgressiveDiscountPrize["translations"];
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as TProgressiveDiscountPrize["translations"];
  }

  return undefined;
}

async function getPrizeTranslationsByIds(
  prizeIds: string[],
): Promise<Map<string, TProgressiveDiscountPrize["translations"] | undefined>> {
  const normalizedPrizeIds = Array.from(
    new Set(prizeIds.map((prizeId) => prizeId.trim()).filter(Boolean)),
  );
  if (!normalizedPrizeIds.length) {
    return new Map();
  }

  const rows = await prisma.$queryRaw<PrizeTranslationsRow[]>`
    SELECT "id", "translations"
    FROM "ProgressiveDiscountPrize"
    WHERE "id" IN (${Prisma.join(normalizedPrizeIds)})
  `;

  return new Map(
    rows.map((row) => [row.id, parsePrizeTranslations(row.translations)]),
  );
}

async function ensureProgressiveDiscountStepExists(
  progressiveDiscountStepId: string,
): Promise<void> {
  const step = await prisma.progressiveDiscountStep.findUnique({
    where: {
      id: progressiveDiscountStepId,
    },
    select: {
      id: true,
    },
  });

  if (step) return;

  throw {
    code: "NOT_FOUND",
    details: {
      service: "PROGRESSIVE_DISCOUNT_STEP",
      id: progressiveDiscountStepId,
    },
  };
}

async function ensureProductsExist(productIds: string[]): Promise<void> {
  if (!productIds.length) return;

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (products.length === productIds.length) return;

  const existingProductIds = new Set(products.map((product) => product.id));
  const missingProductId = productIds.find(
    (productId) => !existingProductIds.has(productId),
  );

  throw {
    code: "NOT_FOUND",
    details: {
      service: "PRODUCT",
      id: missingProductId,
    },
  };
}

async function ensurePrizeExists(prizeId: string): Promise<void> {
  const prize = await prisma.progressiveDiscountPrize.findUnique({
    where: {
      id: prizeId,
    },
    select: {
      id: true,
    },
  });

  if (prize) return;

  throw {
    code: "NOT_FOUND",
    details: {
      service: "PRIZE",
      id: prizeId,
    },
  };
}

async function getPrizeById(prizeId: string): Promise<TProgressiveDiscountPrize> {
  const prize = await prisma.progressiveDiscountPrize.findUnique({
    where: {
      id: prizeId,
    },
    include: progressiveDiscountPrizeInclude,
  });

  if (!prize) {
    throw {
      code: "NOT_FOUND",
      details: {
        service: "PRIZE",
        id: prizeId,
      },
    };
  }

  const translationsByPrizeId = await getPrizeTranslationsByIds([prize.id]);
  const mappedPrize = mapProgressiveDiscountPrize(prize);

  return {
    ...mappedPrize,
    translations:
      translationsByPrizeId.get(mappedPrize.id) ?? mappedPrize.translations,
  };
}

export async function listProgressiveDiscountPrizes(input?: {
  progressiveDiscountStepId?: unknown;
}): Promise<TProgressiveDiscountPrize[]> {
  const parsedStepId =
    input?.progressiveDiscountStepId === undefined
      ? undefined
      : parseProgressiveDiscountStepId(input.progressiveDiscountStepId);

  if (parsedStepId) {
    await ensureProgressiveDiscountStepExists(parsedStepId);
  }

  const prizes = await prisma.progressiveDiscountPrize.findMany({
    where: parsedStepId
      ? {
          progressiveDiscountStepId: parsedStepId,
        }
      : undefined,
    orderBy: {
      createdAt: "asc",
    },
    include: progressiveDiscountPrizeInclude,
  });

  const translationsByPrizeId = await getPrizeTranslationsByIds(
    prizes.map((prize) => prize.id),
  );

  return prizes.map((prize) => {
    const mappedPrize = mapProgressiveDiscountPrize(prize);

    return {
      ...mappedPrize,
      translations:
        translationsByPrizeId.get(mappedPrize.id) ?? mappedPrize.translations,
    };
  });
}

export async function createProgressiveDiscountPrize(
  input: CreateProgressiveDiscountPrizeInput,
): Promise<TProgressiveDiscountPrize> {
  const progressiveDiscountStepId = parseProgressiveDiscountStepId(
    input.progressiveDiscountStepId,
  );
  const name = parseName(input.name);
  const quantity =
    input.quantity === undefined ? 1 : parseQuantity(input.quantity);
  const imageUrl =
    input.imageUrl === undefined ? null : parseImageUrl(input.imageUrl);
  const translations = parseTranslations(input.translations);
  const productIds =
    input.productIds === undefined ? [] : parseProductIds(input.productIds);

  await ensureProgressiveDiscountStepExists(progressiveDiscountStepId);
  await ensureProductsExist(productIds);

  const prizeId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.progressiveDiscountPrize.create({
      data: {
        id: prizeId,
        name,
        ...(translations === undefined ? {} : { translations }),
        quantity,
        imageUrl,
        progressiveDiscountStepId,
      },
    });

    if (!productIds.length) return;

    await tx.progressiveDiscountPrizeProduct.createMany({
      data: productIds.map((productId) => ({
        id: randomUUID(),
        prizeId,
        productId,
      })),
    });
  });

  return getPrizeById(prizeId);
}

export async function updateProgressiveDiscountPrize(
  input: UpdateProgressiveDiscountPrizeInput,
): Promise<TProgressiveDiscountPrize> {
  const prizeId = normalizeId(input.prizeId, "prizeId");
  await ensurePrizeExists(prizeId);

  const updates: {
    name?: string;
    translations?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    quantity?: number;
    imageUrl?: string | null;
    progressiveDiscountStepId?: string;
  } = {};

  if (input.name !== undefined) {
    updates.name = parseName(input.name);
  }

  if (input.translations !== undefined) {
    updates.translations = parseTranslations(input.translations);
  }

  if (input.quantity !== undefined) {
    updates.quantity = parseQuantity(input.quantity);
  }

  if (input.imageUrl !== undefined) {
    updates.imageUrl = parseImageUrl(input.imageUrl);
  }

  let parsedProductIds: string[] | undefined = undefined;

  if (input.productIds !== undefined) {
    parsedProductIds = parseProductIds(input.productIds);
  }

  if (input.progressiveDiscountStepId !== undefined) {
    updates.progressiveDiscountStepId = parseProgressiveDiscountStepId(
      input.progressiveDiscountStepId,
    );
    await ensureProgressiveDiscountStepExists(updates.progressiveDiscountStepId);
  }

  if (parsedProductIds) {
    await ensureProductsExist(parsedProductIds);
  }

  if (!Object.keys(updates).length && parsedProductIds === undefined) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "body",
      },
    };
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(updates).length) {
      await tx.progressiveDiscountPrize.update({
        where: {
          id: prizeId,
        },
        data: updates,
      });
    }

    if (parsedProductIds === undefined) return;

    await tx.progressiveDiscountPrizeProduct.deleteMany({
      where: {
        prizeId,
      },
    });

    if (!parsedProductIds.length) return;

    await tx.progressiveDiscountPrizeProduct.createMany({
      data: parsedProductIds.map((productId) => ({
        id: randomUUID(),
        prizeId,
        productId,
      })),
    });
  });

  return getPrizeById(prizeId);
}
