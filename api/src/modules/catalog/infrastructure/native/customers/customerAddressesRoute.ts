import { randomUUID } from "node:crypto";
import prisma from "../../../../../prisma.js";
import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

type PostBody = {
  city?: unknown;
  complement?: unknown;
  description?: unknown;
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

const DEFAULT_BRANCH_COORDINATES: Coordinates = {
  lat: 28.34883080351401,
  lng: -81.65145586075074,
};
const BASE_DELIVERY_FEE_CENTS = 200;
const DELIVERY_FEE_PER_KM_CENTS = 55;
const MAX_DELIVERY_DISTANCE_KM = 20;

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

function parseOptionalNullableString(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCoordinate(value: unknown, field: "lat" | "lng"): string {
  const normalized = parseRequiredString(value, field);
  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed)) {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  return normalized;
}

function parseCoordinateNumber(value: string, field: "lat" | "lng"): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw { code: "INVALID_PARAMS", details: { field } };
  }

  return parsed;
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

export async function POST(request: NextRequestLike, context: RouteContext) {
  try {
    const { customerId } = await context.params;
    const normalizedCustomerId = customerId.trim();

    if (!normalizedCustomerId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "customerId" },
        { status: 400 },
      );
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        id: normalizedCustomerId,
      },
      select: {
        id: true,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = (await request.json()) as PostBody;

    const description = parseRequiredString(body.description, "description");
    const street = parseRequiredString(body.street, "street");
    const number = parseRequiredString(body.number, "number");
    const city = parseRequiredString(body.city, "city");
    const state = parseRequiredString(body.state, "state");
    const zipCode = parseRequiredString(body.zipCode, "zipCode");
    const lat = parseCoordinate(body.lat, "lat");
    const lng = parseCoordinate(body.lng, "lng");
    const latNumber = parseCoordinateNumber(lat, "lat");
    const lngNumber = parseCoordinateNumber(lng, "lng");
    const complement = parseOptionalNullableString(body.complement, "complement");
    const numberComplement = parseOptionalNullableString(
      body.numberComplement,
      "numberComplement",
    );

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

    const deliveryFee = calculateDeliveryFeeInCents(distanceInKm);

    const created = await prisma.deliveryAddress.create({
      data: {
        id: randomUUID(),
        description,
        street,
        number,
        city,
        State: state,
        zipCode,
        lat,
        lng,
        customerId: normalizedCustomerId,
        ...(complement !== undefined ? { complement } : {}),
        ...(numberComplement !== undefined ? { numberComplement } : {}),
        deliveryFee,
      },
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

    return NextResponse.json(
      {
        id: created.id,
        createdAt: created.createdAt.toISOString(),
        description: created.description,
        street: created.street,
        number: created.number,
        city: created.city,
        state: created.State,
        zipCode: created.zipCode,
        lat: created.lat,
        lng: created.lng,
        complement: created.complement,
        numberComplement: created.numberComplement,
        customerId: created.customerId,
        deliveryFee: created.deliveryFee,
        expectedHandoffDuration: 300,
      },
      { status: 201 },
    );
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

    console.error("POST /customers/[customerId]/addresses error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
