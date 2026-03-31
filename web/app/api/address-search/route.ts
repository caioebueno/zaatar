import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const accessToken =
    "pk.eyJ1IjoiY2Fpb2VidWVubyIsImEiOiJjbW5lcGs4NHQwMXVoMnBvbmQyMHRpNjdsIn0.2_7zwvhhSxx52vnuI56m2A";

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
  console.log(data);
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
    });

  return NextResponse.json(results);
}
