export function calculateDistance(
  coord1: [number, number],
  coord2: [number, number],
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1 = (coord1?.[1] * Math.PI) / 180;
  const lat2 = (coord2?.[1] * Math.PI) / 180;
  const deltaLat = ((coord2?.[1] - coord1?.[1]) * Math.PI) / 180;
  const deltaLon = ((coord2?.[0] - coord1?.[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Returns distance in meters
}
