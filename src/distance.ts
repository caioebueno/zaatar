import axios from "axios";

type Coordinates = {
  lat: number;
  lon: number;
};

type DistanceResult = {
  distance_km: string;
  duration_min: string;
};

async function getCoordinates(address: string): Promise<Coordinates> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  const res = await axios.get(url, {
    headers: { "User-Agent": "Node.js App" },
  });

  if (res.data.length === 0) {
    throw new Error(`Address not found: ${address}`);
  }

  const { lat, lon } = res.data[0];
  return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

export async function getDistance(
  startAddress: string,
  endAddress: string,
): Promise<DistanceResult> {
  const start = await getCoordinates(startAddress);
  const end = await getCoordinates(endAddress);

  const routeUrl = `http://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=false`;

  const res = await axios.get(routeUrl);
  const route = res.data.routes[0];

  console.log(route);

  if (!route) throw new Error("No route found");

  const distanceMeters: number = route.distance;
  const durationSeconds: number = route.duration;

  return {
    distance_km: (distanceMeters / 1000).toFixed(2),
    duration_min: (durationSeconds / 60).toFixed(2),
  };
}
