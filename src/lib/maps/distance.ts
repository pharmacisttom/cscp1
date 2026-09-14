/**
 * Haversine Distance & Travel Time Estimation
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates straight-line great-circle distance between two points in Kilometers
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  return Number(distance.toFixed(2));
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimates driving travel time in minutes based on distance and road characteristics
 * Average district speed: 35-45 km/h + 3 min turn/traffic penalty
 */
export function estimateTravelMinutes(
  distanceKm: number,
  avgSpeedKmh = 40
): number {
  if (distanceKm <= 0.05) return 2;
  const hours = distanceKm / avgSpeedKmh;
  const minutes = Math.round(hours * 60) + 3;
  return Math.max(3, minutes);
}

/**
 * Calculates centroid of a set of coordinate points
 */
export function calculateCentroid(points: { lat: number; lng: number }[]): {
  lat: number;
  lng: number;
} {
  if (points.length === 0) return { lat: 12.9754, lng: 101.2154 };
  const total = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return {
    lat: Number((total.lat / points.length).toFixed(6)),
    lng: Number((total.lng / points.length).toFixed(6)),
  };
}
