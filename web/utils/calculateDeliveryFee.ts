export const BASE_DELIVERY_FEE_CENTS = 200;
export const DELIVERY_FEE_PER_KM_CENTS = 55;
export const MAX_DELIVERY_DISTANCE_KM = 20;
const EARTH_RADIUS_KM = 6371;

type Coordinates = {
  lat: number;
  lng: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function calculateDistanceInKm(
  origin: Coordinates,
  destination: Coordinates,
): number {
  const latDistance = toRadians(destination.lat - origin.lat);
  const lngDistance = toRadians(destination.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);

  const haversine =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * angularDistance;
}

export function calculateDeliveryFeeInCents(distanceInKm: number): number {
  return Math.round(
    BASE_DELIVERY_FEE_CENTS + distanceInKm * DELIVERY_FEE_PER_KM_CENTS,
  );
}

export const MAX_DELIVERY_FEE_CENTS = calculateDeliveryFeeInCents(
  MAX_DELIVERY_DISTANCE_KM,
);
