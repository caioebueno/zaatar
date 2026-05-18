import { NextResponse } from "../shared/http.js";
import type { NextRequestLike } from "../shared/http.js";

const PRIORITY_LAT = 28.34865140234854;
const PRIORITY_LON = -81.65148804725864;

type MapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number];
  address?: string;
  text?: string;
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
};

function getDistanceScore(lat: number, lon: number): number {
  const x =
    (lon - PRIORITY_LON) * Math.cos(((lat + PRIORITY_LAT) / 2) * (Math.PI / 180));
  const y = lat - PRIORITY_LAT;
  return x * x + y * y;
}

export async function GET(request: NextRequestLike) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const accessToken = process.env.MAPBOX_API;
  if (!accessToken) {
    return NextResponse.json({ error: "Missing MAPBOX_TOKEN" }, { status: 500 });
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    country: "us",
    limit: "8",
    types: "address",
    autocomplete: "true",
    proximity: `${PRIORITY_LON},${PRIORITY_LAT}`,
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`,
  );

  if (!response.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };
  const features = data.features ?? [];

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
