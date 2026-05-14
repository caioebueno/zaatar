import { NextRequest, NextResponse } from "next/server";

type MapboxFeature = {
  address?: unknown;
  text?: unknown;
  id?: unknown;
  place_name?: unknown;
  center?: unknown;
  place_type?: unknown;
  context?: unknown;
};

export async function GET(request: NextRequest) {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ||
    "";

  if (!token) {
    return NextResponse.json(
      { error: "MAPBOX_ACCESS_TOKEN is not configured" },
      { status: 500 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 5);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(10, Math.trunc(limitRaw)))
    : 5;

  if (query.length < 2) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set("access_token", token);
    url.searchParams.set("autocomplete", "true");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("types", "address");
    url.searchParams.set("country", "us");

    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as {
      features?: MapboxFeature[];
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload.message || "Mapbox search failed",
        },
        { status: response.status },
      );
    }

    const items = Array.isArray(payload.features)
      ? payload.features
          .map((feature) => {
            const placeId =
              typeof feature.id === "string" && feature.id.trim()
                ? feature.id.trim()
                : "";
            const description =
              typeof feature.place_name === "string" && feature.place_name.trim()
                ? feature.place_name.trim()
                : "";

            const center = Array.isArray(feature.center) ? feature.center : [];
            const longitude =
              typeof center[0] === "number" && Number.isFinite(center[0])
                ? center[0]
                : null;
            const latitude =
              typeof center[1] === "number" && Number.isFinite(center[1])
                ? center[1]
                : null;

            const placeTypes = Array.isArray(feature.place_type) ? feature.place_type : [];
            const isAddressResult = placeTypes.some(
              (entry) => typeof entry === "string" && entry === "address",
            );

            const context = Array.isArray(feature.context) ? feature.context : [];
            const isUSAddress = context.some((entry) => {
              if (!entry || typeof entry !== "object") return false;
              const record = entry as Record<string, unknown>;
              if (typeof record.id === "string" && record.id.startsWith("country.us")) {
                return true;
              }
              return record.short_code === "us";
            });

            if (
              !placeId ||
              !description ||
              latitude === null ||
              longitude === null ||
              !isAddressResult ||
              !isUSAddress
            ) {
              return null;
            }

            return {
              placeId,
              description,
              latitude,
              longitude,
              street:
                typeof feature.text === "string" && feature.text.trim()
                  ? feature.text.trim()
                  : description,
              number:
                typeof feature.address === "string" && feature.address.trim()
                  ? feature.address.trim()
                  : "",
              city: readContextName(context, "place"),
              state: readContextName(context, "region"),
              zipCode: readContextName(context, "postcode"),
            };
          })
          .filter(
            (
              item,
            ): item is {
              placeId: string;
              description: string;
              latitude: number;
              longitude: number;
              street: string;
              number: string;
              city: string;
              state: string;
              zipCode: string;
            } => item !== null,
          )
      : [];

    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not reach Mapbox" }, { status: 502 });
  }
}

function readContextName(
  context: unknown[],
  prefix: string,
): string {
  const match = context.find((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const record = entry as Record<string, unknown>;
    return typeof record.id === "string" && record.id.startsWith(`${prefix}.`);
  });

  if (!match || typeof match !== "object") return "";
  const record = match as Record<string, unknown>;
  return typeof record.text === "string" ? record.text.trim() : "";
}
