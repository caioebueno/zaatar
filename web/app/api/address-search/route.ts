import { NextRequest, NextResponse } from "next/server";

const PRIORITY_LAT = 28.34865140234854;
const PRIORITY_LON = -81.65148804725864;

type TMapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  address?: string;
  text?: string;
  context?: {
    id: string;
    text: string;
    short_code?: string;
  }[];
};

function getDistanceScore(lat: number, lon: number) {
  // Fast equirectangular approximation is enough for nearby ranking.
  const x =
    (lon - PRIORITY_LON) * Math.cos(((lat + PRIORITY_LAT) / 2) * (Math.PI / 180));
  const y = lat - PRIORITY_LAT;

  return x * x + y * y;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const accessToken = process.env.MAPBOX_API;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing MAPBOX_TOKEN" },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    country: "us",
    limit: "8",
    types: "address", // only real addresses
    autocomplete: "true",
    proximity: `${PRIORITY_LON},${PRIORITY_LAT}`,
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query,
    )}.json?${params.toString()}`,
    {
      next: { revalidate: 60 },
    },
  );

  if (!response.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = await response.json();
  const features = data.features as TMapboxFeature[];

  const results = features
    .filter((item) => item.address !== undefined)
    .map((item) => {
      const context = item.context || [];

      const getContext = (type: string) =>
        context.find((c) => c.id.startsWith(type))?.text;

      return {
        id: item.id,
        display_name: item.place_name,
        lat: item.center[1],
        lon: item.center[0],
        address: {
          house_number: item.address || null,
          road: item.text,
          city: getContext("place") || getContext("locality"),
          state: getContext("region"),
          postcode: getContext("postcode"),
          country: getContext("country"),
          country_code:
            context
              .find((c) => c.id.startsWith("country"))
              ?.short_code?.toUpperCase() || "US",
        },
      };
    })
    .sort((left, right) => {
      const leftDistance = getDistanceScore(left.lat, left.lon);
      const rightDistance = getDistanceScore(right.lat, right.lon);

      return leftDistance - rightDistance;
    });

  return NextResponse.json(results);
}
