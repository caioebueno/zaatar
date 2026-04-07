type Coordinates = {
  lat: number;
  lng: number;
};

type MapboxDirectionsResponse = {
  routes?: {
    duration?: number;
  }[];
};

export default async function getMapboxRouteDurationInMinutes(
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
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch route duration from Mapbox");
  }

  const data = (await response.json()) as MapboxDirectionsResponse;
  const durationInSeconds = data.routes?.[0]?.duration;

  if (typeof durationInSeconds !== "number") {
    throw new Error("Mapbox did not return a route duration");
  }

  return durationInSeconds / 60;
}
