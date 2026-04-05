type Coordinates = {
  lat: number;
  lng: number;
};

type MapboxDirectionsResponse = {
  routes?: {
    distance?: number;
  }[];
};

export default async function getMapboxRouteDistanceInKm(
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
    throw new Error("Unable to fetch route distance from Mapbox");
  }

  const data = (await response.json()) as MapboxDirectionsResponse;
  const distanceInMeters = data.routes?.[0]?.distance;

  if (typeof distanceInMeters !== "number") {
    throw new Error("Mapbox did not return a route distance");
  }

  return distanceInMeters / 1000;
}
