import type { Anomaly } from '@/types/api';

/**
 * Validates geographic coordinates to ensure latitude is within [-90, 90]
 * and longitude is within [-180, 180] and neither is NaN, null, or undefined.
 */
export function isValidCoordinate(lat?: number | null, lon?: number | null): boolean {
  if (lat === undefined || lat === null || lon === undefined || lon === null) {
    return false;
  }
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return false;
  }
  if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
    return false;
  }
  return lat >= -90.0 && lat <= 90.0 && lon >= -180.0 && lon <= 180.0;
}

/**
 * Formats a latitude/longitude pair into standard scientific geospatial notation.
 * e.g., 6.3000° S, 71.2000° E
 */
export function formatCoordinate(
  lat?: number | null,
  lon?: number | null,
  decimals: number = 4
): string {
  if (!isValidCoordinate(lat, lon)) {
    return 'GEOLOCATION UNAVAILABLE';
  }

  const validLat = lat!;
  const validLon = lon!;

  const latDir = validLat >= 0 ? 'N' : 'S';
  const lonDir = validLon >= 0 ? 'E' : 'W';

  const absLat = Math.abs(validLat).toFixed(decimals);
  const absLon = Math.abs(validLon).toFixed(decimals);

  return `${absLat}° ${latDir}, ${absLon}° ${lonDir}`;
}

export interface GeolocationPartition {
  geolocated: Anomaly[];
  unlocated: Anomaly[];
  totalCount: number;
  geolocatedCount: number;
  unlocatedCount: number;
  hasGeolocatedPoints: boolean;
}

/**
 * Partitions a list of anomalies into geolocated vs unlocated contacts.
 */
export function partitionByGeolocation(anomalies: Anomaly[]): GeolocationPartition {
  const geolocated: Anomaly[] = [];
  const unlocated: Anomaly[] = [];

  for (const anom of anomalies) {
    if (isValidCoordinate(anom.latitude, anom.longitude)) {
      geolocated.push(anom);
    } else {
      unlocated.push(anom);
    }
  }

  return {
    geolocated,
    unlocated,
    totalCount: anomalies.length,
    geolocatedCount: geolocated.length,
    unlocatedCount: unlocated.length,
    hasGeolocatedPoints: geolocated.length > 0,
  };
}

export interface MapBoundsResult {
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]] | null;
}

/**
 * Calculates center lat/lon, appropriate zoom level, and bounding box coordinates for Leaflet maps.
 */
export function calculateMapCenterAndBounds(
  anomalies: Anomaly[],
  fallbackLat: number = -6.3000,
  fallbackLon: number = 71.2000
): MapBoundsResult {
  const geolocated = anomalies.filter((a) => isValidCoordinate(a.latitude, a.longitude));

  if (geolocated.length === 0) {
    return {
      center: [fallbackLat, fallbackLon],
      zoom: 8,
      bounds: null,
    };
  }

  if (geolocated.length === 1) {
    return {
      center: [geolocated[0].latitude, geolocated[0].longitude],
      zoom: 12,
      bounds: null,
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const a of geolocated) {
    if (a.latitude < minLat) minLat = a.latitude;
    if (a.latitude > maxLat) maxLat = a.latitude;
    if (a.longitude < minLon) minLon = a.longitude;
    if (a.longitude > maxLon) maxLon = a.longitude;
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  // Add small padding to bounds
  const latPadding = Math.max(0.01, (maxLat - minLat) * 0.15);
  const lonPadding = Math.max(0.01, (maxLon - minLon) * 0.15);

  return {
    center: [centerLat, centerLon],
    zoom: 10,
    bounds: [
      [minLat - latPadding, minLon - lonPadding],
      [maxLat + latPadding, maxLon + lonPadding],
    ],
  };
}

/**
 * Generates survey track polyline points between origin and geolocated contacts if available.
 */
export function deriveSurveyTrack(
  originLat: number,
  originLon: number,
  anomalies: Anomaly[]
): [number, number][] {
  const points: [number, number][] = [];

  if (isValidCoordinate(originLat, originLon)) {
    points.push([originLat, originLon]);
  }

  const geolocated = anomalies.filter((a) => isValidCoordinate(a.latitude, a.longitude));
  for (const a of geolocated) {
    points.push([a.latitude, a.longitude]);
  }

  return points;
}
