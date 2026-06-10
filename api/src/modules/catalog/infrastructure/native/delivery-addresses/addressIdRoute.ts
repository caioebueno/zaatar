import prisma from "../../../../../prisma.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

type RouteContext = {
  params: Promise<{
    addressId: string;
  }>;
};

type PatchBody = {
  city?: unknown;
  complement?: unknown;
  description?: unknown;
  expectedHandoffDuration?: unknown;
  lat?: unknown;
  lng?: unknown;
  number?: unknown;
  numberComplement?: unknown;
  state?: unknown;
  street?: unknown;
  zipCode?: unknown;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type BranchCoordinatesRow = {
  lat: string | null;
  lng: string | null;
};

type DeliveryAddressRow = {
  State: string;
  city: string;
  complement: string | null;
  createdAt: Date;
  customerId: string | null;
  deliveryFee: number;
  description: string;
  expectedHandoffDuration: number;
  id: string;
  lat: string;
  lng: string;
  number: string;
  numberComplement: string | null;
  street: string;
  zipCode: string;
};

const DEFAULT_BRANCH_COORDINATES: Coordinates = {
  lat: 28.34883080351401,
  lng: -81.65145586075074,
};
const BASE_DELIVERY_FEE_CENTS = 200;
const DELIVERY_FEE_PER_KM_CENTS = 55;
const MAX_DELIVERY_DISTANCE_KM = 20;

export async function PATCH(request: NextRequestLike, context: RouteContext) {
  try {
    const { addressId } = await context.params;
    const normalizedAddressId = addressId.trim();

    if (!normalizedAddressId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "addressId" },
        { status: 400 },
      );
    }

    const existing = await prisma.deliveryAddress.findUnique({
      where: { id: normalizedAddressId },
      select: {
        id: true,
        lat: true,
        lng: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Delivery address not found" }, { status: 404 });
    }

    const body = (await request.json()) as PatchBody;
    const updateData: Record<string, string | number | null> = {};

    applyOptionalString(updateData, "description", body.description, "description", {
      requiredWhenPresent: true,
    });
    applyOptionalString(updateData, "street", body.street, "street", {
      requiredWhenPresent: true,
    });
    applyOptionalString(updateData, "number", body.number, "number", {
      requiredWhenPresent: true,
    });
    applyOptionalString(updateData, "city", body.city, "city", {
      requiredWhenPresent: true,
    });
    applyOptionalString(updateData, "State", body.state, "state", {
      requiredWhenPresent: true,
    });
    applyOptionalString(updateData, "zipCode", body.zipCode, "zipCode", {
      requiredWhenPresent: true,
    });
    applyOptionalString(updateData, "complement", body.complement, "complement");
    applyOptionalString(
      updateData,
      "numberComplement",
      body.numberComplement,
      "numberComplement",
    );

    if (body.expectedHandoffDuration !== undefined) {
      updateData.expectedHandoffDuration = parseExpectedHandoffDuration(
        body.expectedHandoffDuration,
      );
    }

    if (body.lat !== undefined) {
      updateData.lat = parseCoordinate(body.lat, "lat");
    }

    if (body.lng !== undefined) {
      updateData.lng = parseCoordinate(body.lng, "lng");
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Invalid payload", field: "body" },
        { status: 400 },
      );
    }

    const nextLat = typeof updateData.lat === "string" ? updateData.lat : existing.lat;
    const nextLng = typeof updateData.lng === "string" ? updateData.lng : existing.lng;

    if (updateData.lat !== undefined || updateData.lng !== undefined) {
      const latNumber = parseCoordinateNumber(nextLat, "lat");
      const lngNumber = parseCoordinateNumber(nextLng, "lng");
      const businessId = request.headers?.["x-business-id"]?.trim() || undefined;
      const origin = await resolveOriginCoordinates(businessId);
      const distanceInKm = await getMapboxRouteDistanceInKm(origin, {
        lat: latNumber,
        lng: lngNumber,
      });

      if (distanceInKm > MAX_DELIVERY_DISTANCE_KM) {
        return NextResponse.json(
          {
            error: "Address outside delivery coverage area",
            reason: "OUTSIDE_DELIVERY_COVERAGE_AREA",
          },
          { status: 400 },
        );
      }

      updateData.deliveryFee = calculateDeliveryFeeInCents(distanceInKm);
    }

    const updated = await prisma.deliveryAddress.update({
      where: { id: normalizedAddressId },
      data: updateData as never,
      select: {
        id: true,
        createdAt: true,
        description: true,
        street: true,
        number: true,
        city: true,
        State: true,
        zipCode: true,
        lat: true,
        lng: true,
        complement: true,
        numberComplement: true,
        customerId: true,
        deliveryFee: true,
      },
    });

    const [updatedWithHandoff] = await prisma.$queryRaw<DeliveryAddressRow[]>`
      SELECT
        "id",
        "createdAt",
        "description",
        "street",
        "number",
        "city",
        "State",
        "zipCode",
        "lat",
        "lng",
        "complement",
        "numberComplement",
        "customerId",
        "deliveryFee",
        "expectedHandoffDuration"
      FROM "DeliveryAddress"
      WHERE "id" = ${updated.id}
      LIMIT 1
    `;

    if (!updatedWithHandoff) {
      return NextResponse.json({ error: "Delivery address not found" }, { status: 404 });
    }

    return NextResponse.json(mapDeliveryAddress(updatedWithHandoff));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "INVALID_PARAMS"
    ) {
      const field =
        "details" in error &&
        typeof (error as { details?: { field?: string } }).details?.field ===
          "string"
          ? (error as { details?: { field?: string } }).details?.field
          : undefined;

      return NextResponse.json(
        {
          error: "Invalid payload",
          ...(field ? { field } : {}),
        },
        { status: 400 },
      );
    }

    console.error("PATCH /delivery-addresses/[addressId] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function applyOptionalString(
  target: Record<string, string | number | null>,
  outputField: string,
  value: unknown,
  inputField: string,
  options: { requiredWhenPresent?: boolean } = {},
): void {
  const parsed = parseOptionalNullableString(value, inputField, options);
  if (parsed !== undefined) {
    target[outputField] = parsed;
  }
}

function parseOptionalNullableString(
  value: unknown,
  field: string,
  options: { requiredWhenPresent?: boolean } = {},
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) {
    if (options.requiredWhenPresent) {
      throw { code: "INVALID_PARAMS", details: { field } };
    }
    return null;
  }
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  const normalized = value.trim();
  if (!normalized && options.requiredWhenPresent) {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  return normalized.length > 0 ? normalized : null;
}

function parseCoordinate(value: unknown, field: "lat" | "lng"): string {
  const normalized = parseOptionalNullableString(value, field, {
    requiredWhenPresent: true,
  });

  if (typeof normalized !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  parseCoordinateNumber(normalized, field);
  return normalized;
}

function parseCoordinateNumber(value: string, field: "lat" | "lng"): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  return parsed;
}

function parseExpectedHandoffDuration(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw { code: "INVALID_PARAMS", details: { field: "expectedHandoffDuration" } };
  }

  return value;
}

function calculateDeliveryFeeInCents(distanceInKm: number): number {
  return Math.round(
    BASE_DELIVERY_FEE_CENTS + distanceInKm * DELIVERY_FEE_PER_KM_CENTS,
  );
}

async function getMapboxRouteDistanceInKm(
  origin: Coordinates,
  destination: Coordinates,
): Promise<number> {
  const accessToken = process.env.MAPBOX_API;
  if (!accessToken) {
    throw new Error("Missing MAPBOX_API");
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    alternatives: "false",
    geometries: "geojson",
    overview: "false",
    steps: "false",
  });

  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch route distance from Mapbox");
  }

  const data = (await response.json()) as {
    routes?: Array<{ distance?: number }>;
  };
  const distanceInMeters = data.routes?.[0]?.distance;

  if (typeof distanceInMeters !== "number") {
    throw new Error("Mapbox did not return a route distance");
  }

  return distanceInMeters / 1000;
}

async function resolveOriginCoordinates(
  businessId: string | undefined,
): Promise<Coordinates> {
  if (!businessId) {
    return DEFAULT_BRANCH_COORDINATES;
  }

  const rows = await prisma.$queryRaw<BranchCoordinatesRow[]>`
    SELECT
      address."lat" AS "lat",
      address."lng" AS "lng"
    FROM "Branch" branch
    INNER JOIN "Address" address
      ON address."id" = branch."addressId"
    WHERE branch."businessId" = ${businessId}
      AND address."lat" IS NOT NULL
      AND address."lng" IS NOT NULL
    ORDER BY branch."createdAt" ASC
    LIMIT 1
  `;

  const row = rows[0];
  if (!row?.lat || !row?.lng) {
    return DEFAULT_BRANCH_COORDINATES;
  }

  const lat = Number.parseFloat(row.lat);
  const lng = Number.parseFloat(row.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return DEFAULT_BRANCH_COORDINATES;
  }

  return { lat, lng };
}

function mapDeliveryAddress(address: DeliveryAddressRow) {
  return {
    id: address.id,
    createdAt: address.createdAt.toISOString(),
    description: address.description,
    street: address.street,
    number: address.number,
    city: address.city,
    state: address.State,
    zipCode: address.zipCode,
    lat: address.lat,
    lng: address.lng,
    complement: address.complement,
    numberComplement: address.numberComplement,
    customerId: address.customerId,
    deliveryFee: address.deliveryFee,
    expectedHandoffDuration: address.expectedHandoffDuration,
  };
}
