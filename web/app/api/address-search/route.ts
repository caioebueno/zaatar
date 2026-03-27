import { NextRequest, NextResponse } from "next/server";

type TNominatimAddress = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "8",
    countrycodes: "us",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "YourAppName/1.0 (your@email.com)",
      },
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const data = (await response.json()) as TNominatimAddress[];

  // Keep only US addresses that have a house number
  const filtered = data.filter((item) => {
    return (
      item.address?.country_code?.toLowerCase() === "us" &&
      typeof item.address?.house_number === "string" &&
      item.address.house_number.trim().length > 0
    );
  });

  return NextResponse.json(filtered);
}
