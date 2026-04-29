import { InventoryError } from "@/src/modules/inventory/domain/inventory.errors";
import { NextResponse } from "next/server";

export function parseString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  return normalized;
}

export function parseOptionalString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value !== "string") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  return value;
}

export function parseNullableString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  const normalized = value.trim();
  return normalized || null;
}

export function parseOptionalBoolean(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  return value;
}

export function parseOptionalNullableInt(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  return value;
}

export function parseRequiredInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InventoryError("INVALID_PARAMS", { field });
  }

  return value;
}

export function inventoryErrorResponse(error: unknown, routeLabel: string) {
  if (error instanceof InventoryError) {
    if (error.code === "INVALID_PARAMS") {
      return NextResponse.json(
        {
          error: "Invalid payload",
          ...(error.details.field ? { field: error.details.field } : {}),
          ...(error.details.reason ? { reason: error.details.reason } : {}),
        },
        { status: 400 },
      );
    }

    if (error.code === "NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Not found",
          ...(error.details.service ? { service: error.details.service } : {}),
          ...(error.details.id ? { id: error.details.id } : {}),
        },
        { status: 404 },
      );
    }

    if (error.code === "CONFLICT") {
      return NextResponse.json(
        {
          error: "Conflict",
          ...(error.details.reason ? { reason: error.details.reason } : {}),
        },
        { status: 409 },
      );
    }
  }

  console.error(routeLabel, error);

  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
