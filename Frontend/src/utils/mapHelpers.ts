export function parseLatLng(lat: number, lon: number): { lat: number; lng: number } {
  return { lat, lng: lon };
}

export function formatMapBounds(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): { north: number; south: number; east: number; west: number } {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLon + lonDelta,
    west: centerLon - lonDelta,
  };
}
