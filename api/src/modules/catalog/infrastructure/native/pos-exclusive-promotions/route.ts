import prisma from "../../../../../prisma.js";
import { ExclusivePromotionWeekday } from "../../../../../../../web/src/generated/prisma/index.js";
import {
  ensureComboProductItemTable,
  getComboProductsByComboIds,
} from "../persistence/comboProductsStore.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

const DEFAULT_PROMOTION_TIMEZONE =
  process.env.EXCLUSIVE_PROMOTION_TIMEZONE?.trim() || "America/New_York";

const VALID_WEEKDAYS: ExclusivePromotionWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function parseBooleanQuery(value: string | null, defaultValue: boolean): boolean {
  if (value === null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  throw new Error("onlyAvailable");
}

function parseDateQuery(value: string | null): Date {
  if (!value) return new Date();
  const normalized = value.trim();
  if (!normalized) return new Date();
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("at");
  }
  return parsed;
}

function resolveWeekday(date: Date, timezone: string): ExclusivePromotionWeekday {
  let weekday = "";
  try {
    weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: timezone,
    })
      .format(date)
      .toUpperCase();
  } catch {
    throw new Error("timezone");
  }

  if (VALID_WEEKDAYS.includes(weekday as ExclusivePromotionWeekday)) {
    return weekday as ExclusivePromotionWeekday;
  }
  return "MONDAY";
}

function isAvailableAt(input: {
  active: boolean;
  at: Date;
  expireAt: Date | null;
  validWeekdays: ExclusivePromotionWeekday[];
  weekday: ExclusivePromotionWeekday;
}): boolean {
  if (!input.active) return false;
  if (input.expireAt && input.expireAt.getTime() <= input.at.getTime()) {
    return false;
  }
  if (
    input.validWeekdays.length > 0 &&
    !input.validWeekdays.includes(input.weekday)
  ) {
    return false;
  }
  return true;
}

export async function GET(request: NextRequestLike) {
  try {
    await ensureComboProductItemTable(prisma);

    const onlyAvailable = parseBooleanQuery(
      request.nextUrl.searchParams.get("onlyAvailable"),
      true,
    );
    const at = parseDateQuery(request.nextUrl.searchParams.get("at"));
    const requestedTimezone = request.nextUrl.searchParams.get("timezone");
    const timezone =
      requestedTimezone && requestedTimezone.trim().length > 0
        ? requestedTimezone.trim()
        : DEFAULT_PROMOTION_TIMEZONE;

    const weekday = resolveWeekday(at, timezone);

    const promotions = await prisma.exclusivePromotion.findMany({
      include: {
        products: {
          orderBy: { createdAt: "asc" },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                itemType: true,
                visible: true,
                price: true,
                comparedAtPrice: true,
                translations: true,
                photos: {
                  select: { id: true, url: true },
                  orderBy: { createdAt: "asc" },
                },
                comboSlots: {
                  select: {
                    id: true,
                    name: true,
                    translations: true,
                    minSelect: true,
                    maxSelect: true,
                    allowDuplicates: true,
                    sortIndex: true,
                    options: {
                      select: {
                        productId: true,
                        extraPrice: true,
                        sortIndex: true,
                        product: {
                          select: {
                            name: true,
                            translations: true,
                          },
                        },
                      },
                      orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
                    },
                  },
                  orderBy: [{ sortIndex: "asc" }, { createdAt: "asc" }],
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const comboIds = promotions
      .flatMap((promotion) => promotion.products.map((item) => item.product))
      .filter((product) => product.itemType === "COMBO")
      .map((product) => product.id);
    const comboProductRows = await getComboProductsByComboIds(prisma, comboIds);
    const comboProductsByComboId = new Map<
      string,
      Array<{
        productId: string;
        productName: string;
        productTranslations: unknown | null;
        quantity: number;
      }>
    >();

    for (const row of comboProductRows) {
      const current = comboProductsByComboId.get(row.comboId) ?? [];
      current.push({
        productId: row.productId,
        productName: row.productName,
        productTranslations: row.productTranslations,
        quantity: row.quantity,
      });
      comboProductsByComboId.set(row.comboId, current);
    }

    const payload = promotions
      .map((promotion) => {
        const availableNow = isAvailableAt({
          active: promotion.active,
          expireAt: promotion.expireAt,
          validWeekdays: promotion.validWeekdays,
          at,
          weekday,
        });

        return {
          id: promotion.id,
          createdAt: promotion.createdAt.toISOString(),
          updatedAt: promotion.updatedAt.toISOString(),
          name: promotion.name,
          active: promotion.active,
          expireAt: promotion.expireAt ? promotion.expireAt.toISOString() : null,
          validWeekdays: promotion.validWeekdays,
          availableNow,
          productIds: promotion.products.map((item) => item.productId),
          products: promotion.products.map((item) => ({
            id: item.product.id,
            name: item.product.name,
            itemType: item.product.itemType,
            visible: item.product.visible,
            price: item.product.price,
            comparedAtPrice: item.product.comparedAtPrice,
            translations: item.product.translations,
            photos: item.product.photos,
            comboLineItems:
              item.product.itemType === "COMBO"
                ? item.product.comboSlots.map((slot) => ({
                    id: slot.id,
                    name: slot.name,
                    translations: slot.translations,
                    minSelect: slot.minSelect,
                    maxSelect: slot.maxSelect,
                    allowDuplicates: slot.allowDuplicates,
                    sortIndex: slot.sortIndex,
                    options: slot.options.map((option) => ({
                      productId: option.productId,
                      productName: option.product.name,
                      productTranslations: option.product.translations,
                      extraPrice: option.extraPrice,
                      sortIndex: option.sortIndex,
                    })),
                  }))
                : [],
            products:
              item.product.itemType === "COMBO"
                ? (comboProductsByComboId.get(item.product.id) ?? []).map(
                    (directProduct) => ({
                      productId: directProduct.productId,
                      productName: directProduct.productName,
                      productTranslations: directProduct.productTranslations,
                      quantity: directProduct.quantity,
                    }),
                  )
                : [],
          })),
        };
      })
      .filter((promotion) => (onlyAvailable ? promotion.availableNow : true));

    return NextResponse.json({
      timezone,
      at: at.toISOString(),
      weekday,
      onlyAvailable,
      promotions: payload,
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    console.error("GET /pos/exclusive-promotions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
