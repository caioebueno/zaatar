import createOrder from "@/src/createOrder";
import type TCart from "@/types/cart";
import type { TOrderType, TPaymentMethod } from "@/src/types/order";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  cart?: unknown;
  customerId?: unknown;
  orderType?: unknown;
  paymentMethod?: unknown;
  language?: unknown;
  scheduleFor?: unknown;
  selectedPrize?: unknown;
  tipAmount?: unknown;
  addressId?: unknown;
  cupom?: unknown;
};

const VALID_ORDER_TYPES: TOrderType[] = ["DELIVERY", "TAKEAWAY"];
const VALID_PAYMENT_METHODS: TPaymentMethod[] = ["CARD", "CASH", "ZELLE"];

function parseRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  const normalized = value.trim();
  if (!normalized) {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  return normalized;
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function parseOrderType(value: unknown): TOrderType {
  if (typeof value !== "string" || !VALID_ORDER_TYPES.includes(value as TOrderType)) {
    throw { code: "INVALID_PARAMS", details: { field: "orderType" } };
  }

  return value as TOrderType;
}

function parsePaymentMethod(value: unknown): TPaymentMethod {
  if (
    typeof value !== "string" ||
    !VALID_PAYMENT_METHODS.includes(value as TPaymentMethod)
  ) {
    throw { code: "INVALID_PARAMS", details: { field: "paymentMethod" } };
  }

  return value as TPaymentMethod;
}

function parseTipAmount(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw { code: "INVALID_PARAMS", details: { field: "tipAmount" } };
  }

  return value;
}

function parseSelectedPrize(value: unknown):
  | {
      prizeId: string;
      selectedProductIds: string[];
    }
  | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw { code: "INVALID_PARAMS", details: { field: "selectedPrize" } };
  }

  const prizeId = parseRequiredString(
    (value as { prizeId?: unknown }).prizeId,
    "selectedPrize.prizeId",
  );
  const selectedProductIdsRaw = (value as { selectedProductIds?: unknown })
    .selectedProductIds;

  if (!Array.isArray(selectedProductIdsRaw)) {
    throw {
      code: "INVALID_PARAMS",
      details: { field: "selectedPrize.selectedProductIds" },
    };
  }

  const selectedProductIds = selectedProductIdsRaw.map((item) => {
    if (typeof item !== "string" || !item.trim()) {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "selectedPrize.selectedProductIds" },
      };
    }

    return item.trim();
  });

  return {
    prizeId,
    selectedProductIds,
  };
}

function parseCart(value: unknown): TCart {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw { code: "INVALID_PARAMS", details: { field: "cart" } };
  }

  const itemsRaw = (value as { items?: unknown }).items;
  if (!Array.isArray(itemsRaw)) {
    throw { code: "INVALID_PARAMS", details: { field: "cart.items" } };
  }
  if (itemsRaw.length === 0) {
    throw { code: "INVALID_PARAMS", details: { field: "cart.items" } };
  }

  for (const item of itemsRaw) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw { code: "INVALID_PARAMS", details: { field: "cart.items" } };
    }

    parseRequiredString((item as { cartId?: unknown }).cartId, "cart.items.cartId");
    parseRequiredString(
      (item as { productId?: unknown }).productId,
      "cart.items.productId",
    );

    const quantity = (item as { quantity?: unknown }).quantity;
    if (
      typeof quantity !== "number" ||
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw { code: "INVALID_PARAMS", details: { field: "cart.items.quantity" } };
    }

    const modifiers = (item as { modifiers?: unknown }).modifiers;
    if (!Array.isArray(modifiers)) {
      throw { code: "INVALID_PARAMS", details: { field: "cart.items.modifiers" } };
    }

    for (const modifier of modifiers) {
      if (
        typeof modifier !== "object" ||
        modifier === null ||
        Array.isArray(modifier)
      ) {
        throw {
          code: "INVALID_PARAMS",
          details: { field: "cart.items.modifiers" },
        };
      }

      parseRequiredString(
        (modifier as { modifierId?: unknown }).modifierId,
        "cart.items.modifiers.modifierId",
      );
      parseRequiredString(
        (modifier as { modifierItemId?: unknown }).modifierItemId,
        "cart.items.modifiers.modifierItemId",
      );
    }

    const description = (item as { description?: unknown }).description;
    if (description !== undefined && description !== null && typeof description !== "string") {
      throw {
        code: "INVALID_PARAMS",
        details: { field: "cart.items.description" },
      };
    }
  }

  return value as TCart;
}

function mapInvalidParamsField(message?: string): string | undefined {
  if (!message) return undefined;

  switch (message) {
    case "CART_ITEMS_REQUIRED":
      return "cart.items";
    case "DELIVERY_MUST_HAVE_ADDRESS":
    case "OUTSIDE_DELIVERY_COVERAGE_AREA":
      return "addressId";
    case "INVALID_SELECTED_PRIZE":
      return "selectedPrize";
    case "INVALID_SELECTED_PRIZE_PRODUCTS":
      return "selectedPrize.selectedProductIds";
    case "INVALID_LANGUAGE":
      return "language";
    case "INVALID_SCHEDULE_FOR":
      return "scheduleFor";
    default:
      return undefined;
  }
}

function mapKnownError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: string }).code;
  const detailsField =
    "details" in error &&
    typeof (error as { details?: { field?: string } }).details?.field === "string"
      ? (error as { details?: { field?: string } }).details?.field
      : undefined;
  const message =
    "data" in error &&
    typeof (error as { data?: { message?: string } }).data?.message === "string"
      ? (error as { data?: { message?: string } }).data?.message
      : undefined;
  const productId =
    "data" in error &&
    typeof (error as { data?: { productId?: string } }).data?.productId === "string"
      ? (error as { data?: { productId?: string } }).data?.productId
      : undefined;

  if (code === "INVALID_PARAMS") {
    const field = detailsField || mapInvalidParamsField(message);

    return NextResponse.json(
      {
        error: "Invalid payload",
        ...(field ? { field } : {}),
        ...(message ? { reason: message } : {}),
      },
      { status: 400 },
    );
  }

  if (code === "ERROR_CALCULATING_PRICE") {
    return NextResponse.json(
      {
        error: "Invalid payload",
        field: "cart.items",
        reason: "ERROR_CALCULATING_PRICE",
        ...(productId ? { productId } : {}),
      },
      { status: 400 },
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;
    const cart = parseCart(body.cart);
    const customerId = parseRequiredString(body.customerId, "customerId");
    const orderType = parseOrderType(body.orderType);
    const paymentMethod = parsePaymentMethod(body.paymentMethod);
    const language = parseOptionalString(body.language, "language");
    const scheduleFor = parseOptionalString(body.scheduleFor, "scheduleFor");
    const selectedPrize = parseSelectedPrize(body.selectedPrize);
    const tipAmount = parseTipAmount(body.tipAmount);
    const addressId = parseOptionalString(body.addressId, "addressId");
    const cupom = parseOptionalString(body.cupom, "cupom");

    const order = await createOrder({
      cart,
      customerId,
      orderType,
      paymentMethod,
      language,
      scheduleFor,
      selectedPrize,
      tipAmount,
      addressId,
      cupom,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const knownErrorResponse = mapKnownError(error);

    if (knownErrorResponse) {
      return knownErrorResponse;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    ) {
      const target =
        "meta" in error &&
        typeof (error as { meta?: { field_name?: string } }).meta?.field_name ===
          "string"
          ? (error as { meta?: { field_name?: string } }).meta?.field_name
          : undefined;

      return NextResponse.json(
        {
          error: "Invalid payload",
          reason: "FOREIGN_KEY_CONSTRAINT_FAILED",
          ...(target ? { target } : {}),
        },
        { status: 400 },
      );
    }

    console.error("POST /api/orders error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
